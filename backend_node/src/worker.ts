import { Worker } from "bullmq";
import IORedis from "ioredis";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { config } from "./config";
import { Job } from "./models/Job";
import { JobStatus } from "./types";
import { updateProgress } from "./services/queue";
import { videoService } from "./services/videoService";
import { translationService } from "./services/translationService";
import { ttsService } from "./services/ttsService";

const execAsync = promisify(exec);
const connection = new IORedis(config.redisUrl);

const worker = new Worker(
  "video-processing",
  async (job) => {
    const { jobId } = job.data;
    console.log(`Starting job: ${jobId}`);

    const dbJob = await Job.findById(jobId);
    if (!dbJob) throw new Error("Job not found");

    const tempDir = path.join(config.uploadDir, `temp_${jobId}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    try {
      // 1. Audio Extraction
      await updateProgress(jobId, JobStatus.EXTRACTING_AUDIO, 5);
      const videoFilename = path.basename(dbJob.source_video_url);
      const videoPath = path.join(config.uploadDir, videoFilename);
      const audioPath = path.join(tempDir, "audio.wav");
      await videoService.extractAudio(videoPath, audioPath);

      // 2. Transcription (Using Python Whisper from .venv)
      await updateProgress(jobId, JobStatus.TRANSCRIBING, 10);
      const pythonPath = path.join(path.dirname(path.dirname(config.uploadDir)), ".venv", "Scripts", "python.exe");
      
      const whisperScriptPath = path.join(tempDir, "whisper_task.py");
      const whisperScriptContent = `
import whisper
import json
import os
import sys

# Ensure UTF-8 output for Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

model_name = "${config.whisperModel}"
audio_file = "${audioPath.replace(/\\/g, "/")}"

if not os.path.exists(audio_file):
    print(f"Error: Audio file not found at {audio_file}", file=sys.stderr)
    sys.exit(1)

model = whisper.load_model(model_name)
result = model.transcribe(audio_file, word_timestamps=True)
print(json.dumps(result["segments"]))
`;
      fs.writeFileSync(whisperScriptPath, whisperScriptContent);

      const command = `"${pythonPath}" "${whisperScriptPath}"`;
      const { stdout } = await execAsync(command);
      const segments = JSON.parse(stdout).map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
      }));
      await Job.findByIdAndUpdate(jobId, { $set: { transcript: segments } });
      await updateProgress(jobId, JobStatus.TRANSCRIBING, 40);

      // 3. Translation
      await updateProgress(jobId, JobStatus.TRANSLATING, 50);
      const translatedSegments = await translationService.translateSegments(
        segments,
        dbJob.target_language,
        dbJob.source_language,
        dbJob.options.dubbing_style
      );
      await Job.findByIdAndUpdate(jobId, { $set: { translated_transcript: translatedSegments } });
      await updateProgress(jobId, JobStatus.TRANSLATING, 60);

      // 4. Subtitles
      await updateProgress(jobId, JobStatus.GENERATING_SUBTITLE, 70);
      const srtPath = path.join(tempDir, "subtitle.srt");
      await videoService.generateSrt(translatedSegments, srtPath);
      const subtitleUrl = `/files/outputs/${jobId}/subtitle.vi.srt`;
      const outputJobDir = path.join(config.outputDir, jobId);
      if (!fs.existsSync(outputJobDir)) fs.mkdirSync(outputJobDir, { recursive: true });
      fs.copyFileSync(srtPath, path.join(outputJobDir, "subtitle.vi.srt"));
      await updateProgress(jobId, JobStatus.GENERATING_SUBTITLE, 75, { subtitle_url: subtitleUrl });

      let workingVideoPath = videoPath;

      // 5. Dubbing
      if (dbJob.options.dubbing) {
        await updateProgress(jobId, JobStatus.GENERATING_DUBBING, 78);
        const dubbedAudioPath = path.join(tempDir, "dubbed.mp3");
        await ttsService.generateDubbedAudio(
          translatedSegments,
          dubbedAudioPath,
          dbJob.options.tts_voice,
          dbJob.options.dubbing_style
        );
        
        const mergedPath = path.join(tempDir, "merged.mp4");
        await videoService.replaceAudio(videoPath, dubbedAudioPath, mergedPath);
        workingVideoPath = mergedPath;
        await updateProgress(jobId, JobStatus.GENERATING_DUBBING, 85);
      }

      // 6. Burn Subtitles
      let finalVideoUrl = null;
      if (dbJob.options.burn_subtitle) {
        await updateProgress(jobId, JobStatus.BURNING_SUBTITLE, 90);
        const finalPath = path.join(outputJobDir, "output.mp4");
        await videoService.burnSubtitle(workingVideoPath, srtPath, finalPath);
        finalVideoUrl = `/files/outputs/${jobId}/output.mp4`;
      } else if (dbJob.options.dubbing) {
        const finalPath = path.join(outputJobDir, "output.mp4");
        fs.copyFileSync(workingVideoPath, finalPath);
        finalVideoUrl = `/files/outputs/${jobId}/output.mp4`;
      }

      await updateProgress(jobId, JobStatus.COMPLETED, 100, { output_video_url: finalVideoUrl });

    } catch (err: any) {
      console.error(err);
      await updateProgress(jobId, JobStatus.FAILED, 0, { error_message: err.message });
    } finally {
      // Clean up temp dir
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  },
  { connection }
);

console.log("Worker started...");

import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

export const videoService = {
  async extractAudio(videoPath: string, audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .noVideo()
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });
  },

  async generateSrt(segments: any[], srtPath: string): Promise<void> {
    let content = "";
    segments.forEach((seg, i) => {
      const start = this.formatTime(seg.start);
      const end = this.formatTime(seg.end);
      content += `${i + 1}\n${start} --> ${end}\n${seg.text}\n\n`;
    });
    fs.writeFileSync(srtPath, content);
  },

  formatTime(seconds: number): string {
    const date = new Date(0);
    date.setSeconds(seconds);
    const ms = Math.floor((seconds % 1) * 1000);
    return date.toISOString().substr(11, 8) + "," + ms.toString().padStart(3, "0");
  },

  async replaceAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .input(audioPath)
        .outputOptions([
          "-map 0:v:0",
          "-map 1:a:0",
          "-c:v copy",
          "-shortest"
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });
  },

  async burnSubtitle(videoPath: string, srtPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // FFmpeg subtitles filter on Windows requires a very specific path escaping:
      // 1. Backslashes must be forward slashes or escaped.
      // 2. Colons after drive letters must be escaped.
      // 3. The whole path might need extra quotes or escaping depending on the shell.
      const escapedSrtPath = srtPath
        .replace(/\\/g, "/")
        .replace(/:/g, "\\:");
        
      ffmpeg(videoPath)
        .videoFilters(`subtitles='${escapedSrtPath}'`)
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: any) => {
          console.error("FFmpeg Subtitle Burn Error:", err);
          reject(err);
        })
        .run();
    });
  },
};

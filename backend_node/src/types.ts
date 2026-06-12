export enum JobStatus {
  PENDING = "pending",
  EXTRACTING_AUDIO = "extracting_audio",
  TRANSCRIBING = "transcribing",
  TRANSLATING = "translating",
  GENERATING_SUBTITLE = "generating_subtitle",
  GENERATING_DUBBING = "generating_dubbing",
  BURNING_SUBTITLE = "burning_subtitle",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface JobOptions {
  dubbing: boolean;
  burn_subtitle: boolean;
  tts_voice: string;
  dubbing_style: string;
  keep_original_audio?: boolean;
  original_audio_volume?: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface IJob {
  _id: string;
  original_filename: string;
  source_video_url: string;
  source_language?: string;
  target_language: string;
  status: JobStatus;
  progress: number;
  options: JobOptions;
  output_video_url?: string;
  subtitle_url?: string;
  transcript?: TranscriptSegment[];
  translated_transcript?: TranscriptSegment[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}

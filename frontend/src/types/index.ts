export type JobStatus =
  | "pending"
  | "extracting_audio"
  | "transcribing"
  | "translating"
  | "generating_subtitle"
  | "generating_dubbing"
  | "burning_subtitle"
  | "completed"
  | "failed";

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

export interface Job {
  id: string;
  original_filename: string;
  source_language: string | null;
  target_language: string;
  status: JobStatus;
  progress: number;
  options: JobOptions;
  source_video_url: string;
  output_video_url: string | null;
  subtitle_url: string | null;
  transcript: TranscriptSegment[] | null;
  translated_transcript: TranscriptSegment[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadOptions {
  source_language?: string;
  target_language?: string;
  dubbing?: boolean;
  burn_subtitle?: boolean;
  tts_voice?: string;
  dubbing_style?: string;
}

export interface JobProgressEvent {
  job_id: string;
  status: JobStatus;
  progress: number;
  error?: string;
  subtitle_url?: string;
  output_video_url?: string;
}

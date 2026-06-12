import mongoose, { Schema, Document } from "mongoose";
import { IJob, JobStatus } from "../types";

const JobSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    original_filename: { type: String, required: true },
    source_video_url: { type: String, required: true },
    source_language: { type: String, default: null },
    target_language: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
    },
    progress: { type: Number, default: 0 },
    options: {
      dubbing: { type: Boolean, default: false },
      burn_subtitle: { type: Boolean, default: true },
      tts_voice: { type: String },
      dubbing_style: { type: String, default: "nghiem_tuc" },
      keep_original_audio: { type: Boolean },
      original_audio_volume: { type: Number },
    },
    output_video_url: { type: String, default: null },
    subtitle_url: { type: String, default: null },
    transcript: { type: Array, default: null },
    translated_transcript: { type: Array, default: null },
    error_message: { type: String, default: null },
    created_at: { type: String, required: true },
    updated_at: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false, // We use our own string UUIDs as _id
  }
);

export const Job = mongoose.model<IJob & Document>("Job", JobSchema);

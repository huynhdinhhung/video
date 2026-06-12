import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config";
import { Job } from "../models/Job";
import { JobStatus } from "../types";

const connection = new IORedis(config.redisUrl);

export const videoQueue = new Queue("video-processing", { connection });

export async function addJobToQueue(jobId: string) {
  await videoQueue.add("process", { jobId }, { jobId });
}

// Separate function to update progress and publish to Redis (for WS)
export async function updateProgress(jobId: string, status: JobStatus, progress: number, extras = {}) {
  const now = new Date().toISOString();
  await Job.findByIdAndUpdate(jobId, {
    $set: {
      status,
      progress,
      updated_at: now,
      ...extras
    }
  });

  // BullMQ events or custom Redis publish can be used here
  // For simplicity, we use the same Redis connection to publish
  const channel = `job_progress_${jobId}`;
  await connection.publish(channel, JSON.stringify({
    job_id: jobId,
    status,
    progress,
    ...extras
  }));
}

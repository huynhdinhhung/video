import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { Job } from "../models/Job";
import { JobStatus } from "../types";
import { config } from "../config";
import { addJobToQueue } from "../services/queue";

const router = Router();

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, cb) => {
    const job_id = uuidv4();
    (req as any).job_id = job_id;
    cb(null, `${job_id}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadSizeMb * 1024 * 1024 },
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ detail: "No file uploaded" });

    const jobId = (req as any).job_id;
    const now = new Date().toISOString();

    const jobData = {
      _id: jobId,
      original_filename: req.file.originalname,
      source_video_url: `/files/uploads/${req.file.filename}`,
      source_language: req.body.source_language || null,
      target_language: req.body.target_language || "vi",
      status: JobStatus.PENDING,
      progress: 0,
      options: {
        dubbing: req.body.dubbing === "true",
        burn_subtitle: req.body.burn_subtitle !== "false",
        tts_voice: req.body.tts_voice || config.ttsVoice,
        dubbing_style: req.body.dubbing_style || "nghiem_tuc",
      },
      created_at: now,
      updated_at: now,
    };

    const job = new Job(jobData);
    await job.save();

    // Add to queue
    await addJobToQueue(jobId);

    res.status(201).json({ ...job.toObject(), id: job._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Upload failed" });
  }
});

export default router;

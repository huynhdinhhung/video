import { Router } from "express";
import { Job } from "../models/Job";

import { config } from "../config";
import fs from "fs";
import path from "path";

const router = Router();

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ created_at: -1 });
    res.json(jobs.map(j => ({ ...j.toObject(), id: j._id })));
  } catch (err) {
    res.status(500).json({ detail: "Failed to fetch jobs" });
  }
});

// Get job by ID
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ detail: "Job not found" });
    res.json({ ...job.toObject(), id: job._id });
  } catch (err) {
    res.status(500).json({ detail: "Failed to fetch job" });
  }
});

// Delete job
router.delete("/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ detail: "Job not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ detail: "Failed to delete job" });
  }
});

// Get subtitle
router.get("/:id/subtitle", async (req, res) => {
  try {
    const srtPath = path.join(config.outputDir, req.params.id, "subtitle.vi.srt");
    if (!fs.existsSync(srtPath)) return res.status(404).json({ detail: "Subtitle not found" });
    res.download(srtPath, "subtitle.vi.srt");
  } catch (err) {
    res.status(500).json({ detail: "Failed to fetch subtitle" });
  }
});

// Download processed video
router.get("/:id/download", async (req, res) => {
  try {
    const videoPath = path.join(config.outputDir, req.params.id, "output.mp4");
    if (!fs.existsSync(videoPath)) return res.status(404).json({ detail: "Video not found" });
    
    const job = await Job.findById(req.params.id);
    const filename = job ? `processed-${job.original_filename}` : "output.mp4";
    
    res.download(videoPath, filename);
  } catch (err) {
    res.status(500).json({ detail: "Failed to download video" });
  }
});

export default router;

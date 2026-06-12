import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { WebSocketServer } from "ws";
import { config } from "./config";
import jobRoutes from "./routes/jobs";
import uploadRoutes from "./routes/upload";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Ensure directories exist
if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir, { recursive: true });
if (!fs.existsSync(config.outputDir)) fs.mkdirSync(config.outputDir, { recursive: true });

app.use(cors());
app.use(express.json());

// Static files
app.use("/files/uploads", express.static(config.uploadDir));
app.use("/files/outputs", express.static(config.outputDir));

// Routes
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/upload", uploadRoutes);

// Health check
app.get("/health", async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "ok" : "error";
  res.json({
    status: "ok",
    version: "1.0.0-node",
    services: { db: dbStatus },
  });
});

// WebSocket handling
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  
  if (pathname.startsWith("/ws/jobs/")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (ws, request) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  const jobId = pathname.split("/").pop();
  console.log(`WS Connection for job: ${jobId}`);

  // In Node version, we can use Redis Pub/Sub directly or BullMQ listeners
  // For now, simpler to just close if job ID missing
  if (!jobId) {
    ws.close();
    return;
  }
});

// Database connection
mongoose.connect(config.mongodbUrl, { dbName: config.mongodbDbName })
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(config.apiPort, () => {
      console.log(`Server running on http://localhost:${config.apiPort}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

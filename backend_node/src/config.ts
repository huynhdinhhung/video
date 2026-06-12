import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  apiHost: process.env.API_HOST || "0.0.0.0",
  apiPort: parseInt(process.env.API_PORT || "8000"),
  mongodbUrl: process.env.MONGODB_URL || "mongodb://localhost:27017",
  mongodbDbName: process.env.MONGODB_DB_NAME || "videotranslate",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379/0",
  whisperModel: process.env.WHISPER_MODEL || "base",
  ttsVoice: process.env.TTS_VOICE || "vi-VN-HoaiMyNeural",
  uploadDir: path.resolve(__dirname, "..", "uploads"),
  outputDir: path.resolve(__dirname, "..", "outputs"),
  maxUploadSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || "500"),
};

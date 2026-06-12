import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

const VOICE_MAPPING: Record<string, string> = {
  ngau: "vi-VN-NamMinhNeural",
  de_thuong: "vi-VN-HoaiMyNeural",
  nghiem_tuc: "vi-VN-HoaiMyNeural",
  chi_google: "vi-VN-HoaiMyNeural",
  hai_huoc: "vi-VN-NamMinhNeural",
};

export const ttsService = {
  async generateDubbedAudio(segments: any[], outputPath: string, voice?: string, style: string = "nghiem_tuc"): Promise<void> {
    const selectedVoice = voice || VOICE_MAPPING[style] || "vi-VN-HoaiMyNeural";
    
    // Combine all text for simpler TTS (or handle per segment if timing is critical)
    // For now, simpler to combine but better to use word-timestamps for alignment
    const fullText = segments.map(s => s.text).join(" ");
    
    // Command to run edge-tts
    const command = `edge-tts --voice ${selectedVoice} --text "${fullText.replace(/"/g, '\\"')}" --write-media ${outputPath}`;
    
    try {
      await execAsync(command);
    } catch (err) {
      console.error("TTS Error:", err);
      throw new Error("Failed to generate dubbed audio");
    }
  },
};

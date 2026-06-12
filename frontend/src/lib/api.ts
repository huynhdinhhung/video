import type { Job, UploadOptions } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<{ status: string; version?: string; services?: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    return handleResponse(res);
  },

  async getJobs(): Promise<Job[]> {
    const res = await fetch(`${API_BASE}/api/v1/jobs`, { cache: "no-store" });
    return handleResponse(res);
  },

  async getJob(id: string): Promise<Job> {
    const res = await fetch(`${API_BASE}/api/v1/jobs/${id}`, { cache: "no-store" });
    return handleResponse(res);
  },

  async upload(file: File, options: UploadOptions = {}): Promise<Job> {
    const form = new FormData();
    form.append("file", file);
    if (options.source_language) form.append("source_language", options.source_language);
    form.append("target_language", options.target_language ?? "vi");
    form.append("dubbing", String(options.dubbing ?? false));
    form.append("burn_subtitle", String(options.burn_subtitle ?? true));
    form.append("tts_voice", options.tts_voice ?? "vi-VN-HoaiMyNeural");
    form.append("dubbing_style", options.dubbing_style ?? "nghiem_tuc");

    const res = await fetch(`${API_BASE}/api/v1/upload`, {
      method: "POST",
      body: form,
    });
    return handleResponse(res);
  },

  async deleteJob(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? "Delete failed");
    }
  },

  subtitleUrl(id: string) {
    return `${API_BASE}/api/v1/jobs/${id}/subtitle`;
  },

  downloadUrl(id: string) {
    return `${API_BASE}/api/v1/jobs/${id}/download`;
  },
};

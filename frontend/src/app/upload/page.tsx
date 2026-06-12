"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const TTS_VOICES = [
  { value: "vi-VN-HoaiMyNeural", label: "Hoài My (Nữ)" },
  { value: "vi-VN-NamMinhNeural", label: "Nam Minh (Nam)" },
  { value: "vi-VN-ThuHaNeural", label: "Thu Hà (Nữ)" },
  { value: "vi-VN-TrucAnhNeural", label: "Trúc Anh (Nữ)" },
  { value: "vi-VN-BaoBinhNeural", label: "Bảo Bình (Nam)" },
];

const DUBBING_STYLES = [
  { value: "nghiem_tuc", label: "Nghiêm túc 👔" },
  { value: "ngau", label: "Cool ngầu 😎" },
  { value: "kute", label: "Dễ thương 🥰" },
  { value: "chi_google", label: "Chị Google 🤖" },
  { value: "hai", label: "Hài hước 😂" },
];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dubbing, setDubbing] = useState(false);
  const [burnSubtitle, setBurnSubtitle] = useState(true);
  const [ttsVoice, setTtsVoice] = useState("vi-VN-HoaiMyNeural");
  const [dubbingStyle, setDubbingStyle] = useState("nghiem_tuc");

  const onFile = useCallback((f: File | null) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["mp4", "mkv", "mov"].includes(ext ?? "")) {
      setError("Chỉ hỗ trợ MP4, MKV, MOV");
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      setError("File tối đa 500MB");
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const job = await api.upload(file, {
        dubbing,
        burn_subtitle: burnSubtitle,
        tts_voice: ttsVoice,
        dubbing_style: dubbingStyle,
      });
      router.push(`/jobs/${job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="mb-6 text-2xl font-bold">Upload Video</h1>

        <div
          className={cn(
            "mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
            dragging ? "border-violet-500 bg-violet-500/5" : "border-border hover:border-violet-500/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFile(e.dataTransfer.files[0] ?? null);
          }}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Kéo thả video vào đây</p>
          <p className="text-sm text-muted-foreground">MP4, MKV, MOV — tối đa 500MB</p>
          {file && <p className="mt-3 text-sm text-violet-400">{file.name}</p>}
          <input
            id="file-input"
            type="file"
            accept=".mp4,.mkv,.mov,video/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tùy chọn xử lý</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={burnSubtitle} onChange={(e) => setBurnSubtitle(e.target.checked)} />
              Gắn phụ đề lên video (burn)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={dubbing} onChange={(e) => setDubbing(e.target.checked)} />
              Tự lồng tiếng (TTS)
            </label>

            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Phong cách dịch & lồng tiếng</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2"
                value={dubbingStyle}
                onChange={(e) => setDubbingStyle(e.target.value)}
              >
                {DUBBING_STYLES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            {dubbing && (
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Giọng đọc (Tùy chọn)</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                >
                  <option value="auto">Tự động theo phong cách</option>
                  {TTS_VOICES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <Button className="mt-6 w-full" disabled={!file || uploading} onClick={handleUpload}>
          {uploading ? "Đang upload..." : "Bắt đầu dịch"}
        </Button>
      </main>
    </div>
  );
}

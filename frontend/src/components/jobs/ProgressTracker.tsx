"use client";

import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import type { JobStatus } from "@/types";
import { cn } from "@/lib/utils";

const STEPS: { key: JobStatus; label: string }[] = [
  { key: "pending", label: "Upload" },
  { key: "transcribing", label: "Nhận diện" },
  { key: "translating", label: "Dịch thuật" },
  { key: "generating_subtitle", label: "Tạo phụ đề" },
  { key: "generating_dubbing", label: "Lồng tiếng" },
  { key: "burning_subtitle", label: "Xuất video" },
  { key: "completed", label: "Hoàn thành" },
];

const STATUS_ORDER: JobStatus[] = [
  "pending",
  "extracting_audio",
  "transcribing",
  "translating",
  "generating_subtitle",
  "generating_dubbing",
  "burning_subtitle",
  "completed",
];

function stepIndex(status: JobStatus): number {
  if (status === "failed") return -1;
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

interface ProgressTrackerProps {
  status: JobStatus;
  progress: number;
}

export function ProgressTracker({ status, progress }: ProgressTrackerProps) {
  const current = stepIndex(status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step, i) => {
          const stepOrder = STATUS_ORDER.indexOf(step.key);
          const done = current > stepOrder || status === "completed";
          const active = !done && current >= stepOrder - 1 && status !== "failed";
          const failed = status === "failed" && i === Math.max(0, current);

          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                done && "border-green-500/30 bg-green-500/10 text-green-400",
                active && "border-violet-500/50 bg-violet-500/10 text-violet-300",
                failed && "border-red-500/30 bg-red-500/10 text-red-400",
                !done && !active && !failed && "border-border text-muted-foreground"
              )}
            >
              {done ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : failed ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {step.label}
            </div>
          );
        })}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">{progress}% — {status}</p>
    </div>
  );
}

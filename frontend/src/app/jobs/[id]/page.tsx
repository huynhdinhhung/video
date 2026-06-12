"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressTracker } from "@/components/jobs/ProgressTracker";
import { useJobProgress } from "@/hooks/useJobProgress";
import { api } from "@/lib/api";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { progress, status, error: wsError } = useJobProgress(id);
  const [deleting, setDeleting] = useState(false);

  const { data: job, refetch } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.getJob(id),
    refetchInterval: (query) =>
      query.state.data?.status === "completed" || query.state.data?.status === "failed"
        ? false
        : 5000,
  });

  const displayStatus = status !== "pending" || !job ? status : job.status;
  const displayProgress = progress > 0 ? progress : (job?.progress ?? 0);

  useEffect(() => {
    if (status === "completed" || status === "failed") {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    }
  }, [status, refetch, queryClient]);

  const handleDelete = async () => {
    if (!confirm("Xóa job này?")) return;
    setDeleting(true);
    try {
      await api.deleteJob(id);
      router.push("/jobs");
    } finally {
      setDeleting(false);
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <p className="text-muted-foreground">Đang tải job...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Link href="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Quay lại Jobs
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{job.original_filename}</h1>
            <p className="text-sm text-muted-foreground">ID: {job.id}</p>
          </div>
          <div className="flex gap-2">
            {job.subtitle_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={api.subtitleUrl(id)} target="_blank" rel="noreferrer">
                  <Download className="mr-1 h-4 w-4" /> SRT
                </a>
              </Button>
            )}
            {job.output_video_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={api.downloadUrl(id)} target="_blank" rel="noreferrer">
                  <Download className="mr-1 h-4 w-4" /> Video
                </a>
              </Button>
            )}
            <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
              <Trash2 className="mr-1 h-4 w-4" /> Xóa
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Tiến trình</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressTracker status={displayStatus} progress={displayProgress} />
            {(job.error_message || wsError) && (
              <p className="mt-4 text-sm text-red-400">{job.error_message || wsError}</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {job.source_video_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video gốc</CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  controls
                  className="w-full rounded-lg"
                  src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${job.source_video_url}`}
                />
              </CardContent>
            </Card>
          )}

          {job.output_video_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video kết quả</CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  controls
                  className="w-full rounded-lg"
                  src={api.downloadUrl(id)}
                />
              </CardContent>
            </Card>
          )}

          <Card className={job.output_video_url ? "lg:col-span-2" : ""}>
            <CardHeader>
              <CardTitle className="text-lg">Transcript</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-3 overflow-y-auto">
              {job.transcript?.map((seg, i) => (
                <div key={i} className="rounded border border-border/50 p-2 text-sm">
                  <p className="text-muted-foreground">[Gốc] {seg.text}</p>
                  {job.translated_transcript?.[i] && (
                    <p className="mt-1 text-violet-300">[VI] {job.translated_transcript[i].text}</p>
                  )}
                </div>
              ))}
              {!job.transcript?.length && (
                <p className="text-muted-foreground">Chưa có transcript</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

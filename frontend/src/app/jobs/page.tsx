"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import type { Job } from "@/types";

function statusLabel(status: string) {
  if (status === "completed") return "✅ Hoàn thành";
  if (status === "failed") return "❌ Lỗi";
  if (status === "pending") return "⏳ Chờ xử lý";
  return `🔄 ${status}`;
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="transition-colors hover:border-violet-500/50">
        <CardHeader className="pb-2">
          <CardTitle className="truncate text-base">{job.original_filename}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-muted-foreground">{statusLabel(job.status)}</p>
          <Progress value={job.progress} />
          <p className="mt-1 text-xs text-muted-foreground">{job.progress}%</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function JobsPage() {
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ["jobs"],
    queryFn: api.getJobs,
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Jobs</h1>
          <Button asChild>
            <Link href="/upload">+ Upload mới</Link>
          </Button>
        </div>

        {isLoading && <p className="text-muted-foreground">Đang tải...</p>}
        {error && (
          <p className="text-red-400">
            Lỗi tải danh sách.{" "}
            <button className="underline" onClick={() => refetch()}>Thử lại</button>
          </p>
        )}
        {jobs?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Chưa có job nào.{" "}
              <Link href="/upload" className="text-violet-400 underline">Upload video</Link>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs?.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export default function HomePage() {
  const { data: health } = useQuery<{ status: string }>({
    queryKey: ["health"],
    queryFn: api.getHealth,
    retry: 1,
  });

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: api.getJobs,
    refetchInterval: 10000,
  });

  const recent = jobs?.slice(0, 3) ?? [];
  const completed = jobs?.filter((j) => j.status === "completed").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <section className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Dịch video thông minh</h1>
          <p className="mt-2 text-muted-foreground">
            Vietsub + Tự lồng tiếng chỉ với vài cú click
          </p>
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{jobs?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Video đã xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{completed}</p>
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{health?.status === "ok" ? "Online" : "—"}</p>
              <p className="text-sm text-muted-foreground">API status</p>
            </CardContent>
          </Card>
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Jobs gần đây</h2>
            <Button variant="outline" asChild>
              <Link href="/jobs">Xem tất cả</Link>
            </Button>
          </div>
          {recent.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chưa có job. Bắt đầu upload video đầu tiên.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {recent.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:border-violet-500/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="truncate text-base">{job.original_filename}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={job.progress} />
                      <p className="mt-1 text-xs text-muted-foreground">{job.status}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Button size="lg" asChild>
          <Link href="/upload">+ Upload video mới</Link>
        </Button>
      </main>
    </div>
  );
}

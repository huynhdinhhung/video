"use client";

import { useEffect, useState, useCallback } from "react";
import type { JobProgressEvent, JobStatus } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useJobProgress(jobId: string) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<JobStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/jobs/${jobId}`);

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        // Don't try to reconnect endlessly
      };
      ws.onerror = () => {
        setConnected(false);
        // Don't let WebSocket errors crash the app
      };

      ws.onmessage = (event) => {
        try {
          const data: JobProgressEvent = JSON.parse(event.data);
          setProgress(data.progress);
          setStatus(data.status);
          if (data.error) setError(data.error);
        } catch (e) {
          // Ignore parse errors
        }
      };

      return ws;
    } catch (e) {
      // If WebSocket connection fails completely, just return null
      return null;
    }
  }, [jobId]);

  useEffect(() => {
    const ws = connect();
    if (!ws) return;

    return () => {
      try {
        ws.close();
      } catch (e) {
        // Ignore close errors
      }
    };
  }, [connect]);

  return { progress, status, error, connected };
}

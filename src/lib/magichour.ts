import { env } from "@/lib/env";
import type { TransformParams } from "@/lib/schemas";

const BASE_URL = "https://api.magichour.ai/v1";

export class MagicHourError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env().MAGIC_HOUR_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new MagicHourError(res.status, body.code ?? "unknown", body.message ?? res.statusText);
  }
  return body as T;
}

export function createVideoToVideo(params: TransformParams, videoUrl: string) {
  return request<{ id: string; credits_charged: number }>("/video-to-video", {
    method: "POST",
    body: JSON.stringify({
      ...params,
      assets: { video_source: "file", video_file_path: videoUrl },
    }),
  });
}

export type VideoProjectStatus = "draft" | "queued" | "rendering" | "complete" | "error" | "canceled";

export function getVideoProject(id: string) {
  return request<{
    id: string;
    status: VideoProjectStatus;
    credits_charged: number;
    error: { code: string; message: string } | null;
    downloads: { url: string; expires_at: string }[];
  }>(`/video-projects/${encodeURIComponent(id)}`);
}

// Free call; used only to verify the API key.
export function getAccount() {
  return request<{ id: string; name: string; email: string }>("/account");
}

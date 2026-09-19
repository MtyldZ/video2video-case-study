import { createHmac, timingSafeEqual } from "node:crypto";
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

// Subset of a video project; same shape in GET /video-projects/{id} and webhook payloads.
export interface VideoProject {
  id: string;
  status: VideoProjectStatus;
  credits_charged?: number;
  error?: { code: string; message: string } | null;
  downloads?: { url: string }[];
}

export function getVideoProject(id: string) {
  return request<VideoProject>(`/video-projects/${encodeURIComponent(id)}`);
}

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

// Magic Hour signs `${timestamp}.${rawBody}` with HMAC-SHA256 (hex) using the webhook secret.
export function verifyWebhookSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!timestamp || !signature || !/^\d+$/.test(timestamp) || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) return false; // replay window
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

// Free call: credit balance (also used to verify the API key).
export function getAccount() {
  return request<{ id: string; credits: number }>("/account");
}

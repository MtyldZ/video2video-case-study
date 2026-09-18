import type { HistoryItem, TransformBody } from "@/lib/schemas";

// Client-side calls to our API routes. Errors are thrown with user-facing messages.

async function call<T>(input: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, { cache: "no-store", ...init });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}

export const fetchHistory = () => call<{ items: HistoryItem[] }>("/api/history").then((d) => d.items);

export const startTransform = (body: TransformBody) =>
  call<{ id: string }>("/api/transform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// Re-run a past job with the same source and parameters (a new job, new credits).
export const retryTransform = (item: HistoryItem) =>
  startTransform({ source: { url: item.sourceUrl, publicId: item.sourcePublicId }, params: item.params });

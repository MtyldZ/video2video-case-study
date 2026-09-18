import { uploadVideoFromUrl } from "@/lib/cloudinary";
import { MAX_VIDEO_BYTES, uploadBodySchema, VIDEO_MIME_TYPES } from "@/lib/schemas";

// Cloudinary pulls the whole video before responding.
export const maxDuration = 60;

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Copies a video already uploaded to Uploadcare into Cloudinary.
export async function POST(req: Request) {
  const body = uploadBodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return fail(400, "Invalid video URL. Only Uploadcare CDN URLs are accepted.");
  const url = body.data.uploadcareUrl;

  // Re-check format and size server-side; the widget's checks can be bypassed.
  const head = await fetch(url, { method: "HEAD" }).catch(() => null);
  if (!head?.ok) return fail(400, "Video URL is not reachable.");
  const type = head.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (!VIDEO_MIME_TYPES.includes(type)) return fail(415, "Unsupported format. Please upload an MP4 or MOV video.");
  if (Number(head.headers.get("content-length")) > MAX_VIDEO_BYTES) {
    return fail(413, `Video is too large. Maximum size is ${MAX_VIDEO_BYTES / 1024 / 1024} MB.`);
  }

  try {
    return Response.json(await uploadVideoFromUrl(url, "sources"));
  } catch (e) {
    console.error("Cloudinary upload failed", e);
    return fail(502, "Could not store the video. Please try again.");
  }
}

import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";
import type { UploadedVideo } from "@/lib/schemas";

let configured = false;

function client() {
  if (!configured) {
    cloudinary.config({
      cloud_name: env().CLOUDINARY_CLOUD_NAME,
      api_key: env().CLOUDINARY_API_KEY,
      api_secret: env().CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export class CloudinaryError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// The SDK rejects with plain objects like `{ error: { message, http_code } }`.
function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  const err = (e as { error?: { message?: string; http_code?: number } })?.error;
  return new CloudinaryError(err?.http_code ?? 500, err?.message ?? "Cloudinary request failed");
}

// Cloudinary fetches the remote URL itself, so the video never streams through our function.
// A fixed `publicId` makes repeated uploads (e.g. webhook retries) overwrite instead of duplicating.
export async function uploadVideoFromUrl(
  url: string,
  folder: "sources" | "results",
  publicId?: string,
): Promise<UploadedVideo> {
  const res = await client()
    .uploader.upload(url, { resource_type: "video", folder: `video2video/${folder}`, public_id: publicId })
    .catch((e) => {
      throw toError(e);
    });
  return {
    url: res.secure_url,
    publicId: res.public_id,
    duration: res.duration as number | undefined,
  };
}

export async function pingCloudinary() {
  return client()
    .api.ping()
    .catch((e) => {
      throw toError(e);
    });
}

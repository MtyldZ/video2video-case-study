import { z } from "zod";

const schema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  MONGODB_URI: z.string().startsWith("mongodb"),
  MONGODB_DB: z.string().min(1).default("video2video"),
  MAGIC_HOUR_API_KEY: z.string().min(1),
  // Only known after registering the webhook in the Magic Hour dashboard.
  MAGIC_HOUR_WEBHOOK_SECRET: z.string().optional(),
});

let cached: z.infer<typeof schema> | undefined;

// Lazy so `next build` doesn't need secrets; fails on first server use instead.
export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const keys = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid or missing env vars: ${keys}`);
    }
    cached = parsed.data;
  }
  return cached;
}

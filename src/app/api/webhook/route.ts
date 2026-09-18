import { z } from "zod";
import { env } from "@/lib/env";
import { applyProjectResult } from "@/lib/jobs";
import { verifyWebhookSignature } from "@/lib/magichour";

// Copying the result video into Cloudinary can take a while.
export const maxDuration = 60;

const eventSchema = z.object({
  type: z.string(),
  payload: z.object({
    id: z.string().min(1),
    status: z.enum(["draft", "queued", "rendering", "complete", "error", "canceled"]),
    credits_charged: z.number().optional(),
    error: z.object({ code: z.string(), message: z.string() }).nullish(),
    downloads: z.array(z.object({ url: z.url() })).nullish().transform((d) => d ?? []),
  }),
});

const HANDLED = new Set(["video.completed", "video.errored"]);

// Receives Magic Hour events (registered in its dashboard). Non-2xx makes Magic Hour retry for up to 24h,
// which covers transient Cloudinary/DB failures and the race where the event beats our job-id write.
export async function POST(req: Request) {
  const secret = env().MAGIC_HOUR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MAGIC_HOUR_WEBHOOK_SECRET is not set; rejecting webhook");
    return new Response("Webhook not configured", { status: 500 });
  }

  const raw = await req.text(); // raw body: re-serialized JSON would not match the signature
  const valid = verifyWebhookSignature(
    raw,
    req.headers.get("magic-hour-event-timestamp"),
    req.headers.get("magic-hour-event-signature"),
    secret,
  );
  if (!valid) return new Response("Invalid signature", { status: 401 });

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const event = eventSchema.safeParse(json);
  if (!event.success) return new Response("Invalid payload", { status: 400 });
  if (!HANDLED.has(event.data.type)) return new Response(null, { status: 204 });

  try {
    const outcome = await applyProjectResult(event.data.payload);
    if (outcome === "not_found") return new Response("Unknown job", { status: 404 });
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error("Webhook processing failed", event.data.payload.id, e);
    return new Response("Processing failed", { status: 500 });
  }
}

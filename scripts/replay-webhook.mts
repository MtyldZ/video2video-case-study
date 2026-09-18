// Sends a signed Magic Hour-style webhook to the local (or given) app, for testing without a tunnel.
// Usage: npm run webhook:replay -- <mhJobId> [completed|errored] [url]
import { createHmac } from "node:crypto";

const [id, kind = "completed", url = "http://localhost:3000/api/webhook"] = process.argv.slice(2);
const secret = process.env.MAGIC_HOUR_WEBHOOK_SECRET;
if (!id || !secret || !["completed", "errored"].includes(kind)) {
  console.error("Usage: npm run webhook:replay -- <mhJobId> [completed|errored] [url]  (needs MAGIC_HOUR_WEBHOOK_SECRET)");
  process.exit(1);
}

const payload =
  kind === "completed"
    ? { id, status: "complete", credits_charged: 10, error: null, downloads: [{ url: "https://res.cloudinary.com/demo/video/upload/dog.mp4", expires_at: new Date(Date.now() + 3600e3).toISOString() }] }
    : { id, status: "error", credits_charged: 0, error: { code: "render_failed", message: "Replay: simulated render failure" }, downloads: [] };

const body = JSON.stringify({ type: `video.${kind}`, payload });
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", "magic-hour-event-timestamp": timestamp, "magic-hour-event-signature": signature },
  body,
});
console.log(res.status, await res.text());

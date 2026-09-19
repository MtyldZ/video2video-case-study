import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "../src/lib/magichour";
import { estimateCredits, transformParamsSchema, uploadBodySchema } from "../src/lib/schemas";

const base = { start_seconds: 0, end_seconds: 3, style: { art_style: "Pixar" } };
const ok = (v: unknown) => transformParamsSchema.safeParse(v).success;

const parsed = transformParamsSchema.parse(base);
assert.equal(parsed.fps_resolution, "HALF");
assert.equal(parsed.style.model, "default");

assert.ok(!ok({ ...base, end_seconds: 0 }), "end must be > start");
assert.ok(!ok({ ...base, start_seconds: 3 }), "end == start rejected");
assert.ok(!ok({ ...base, style: { art_style: "Nope" } }), "unknown art style");
assert.ok(ok({ ...base, start_seconds: 1.2, end_seconds: 6.2 }), "exactly 5s allowed");
assert.ok(!ok({ ...base, end_seconds: 5.1 }), "over 5s rejected");
assert.ok(!ok({ ...base, style: { art_style: "Pixar", prompt_type: "custom" } }), "custom needs prompt");
assert.ok(ok({ ...base, style: { art_style: "Pixar", prompt_type: "custom", prompt: "a cat" } }));
assert.ok(!ok({ ...base, style: { art_style: "Pixar", prompt_type: "append_default", prompt: "   " } }), "blank prompt");

const url = (u: unknown) => uploadBodySchema.safeParse({ uploadcareUrl: u }).success;
assert.ok(url("https://ucarecdn.com/abc/"));
assert.ok(url("https://1a2b3c.ucarecd.net/abc/"));
assert.ok(!url("http://ucarecdn.com/abc/"), "https only");
assert.ok(!url("https://evil.com/ucarecdn.com/"), "foreign host");
assert.ok(!url("https://ucarecdn.com.evil.com/"), "suffix trick");
assert.ok(!url("https://a.b.ucarecd.net/"), "nested subdomain");
assert.ok(!url("not a url"));

// Webhook signature: HMAC-SHA256 hex of `${timestamp}.${body}`.
const secret = "whsec_test";
const body = '{"type":"video.completed","payload":{"id":"abc"}}';
const ts = "1729314984";
const sig = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
const now = Number(ts) + 10;
assert.ok(verifyWebhookSignature(body, ts, sig, secret, now));
assert.ok(verifyWebhookSignature(body, ts, sig.toUpperCase(), secret, now), "hex case-insensitive");
assert.ok(!verifyWebhookSignature(body + " ", ts, sig, secret, now), "tampered body");
assert.ok(!verifyWebhookSignature(body, ts, sig, "other", now), "wrong secret");
assert.ok(!verifyWebhookSignature(body, ts, sig, secret, now + 301), "too old");
assert.ok(!verifyWebhookSignature(body, ts, sig, secret, Number(ts) - 301), "too far in future");
assert.ok(!verifyWebhookSignature(body, null, sig, secret, now), "missing timestamp");
assert.ok(!verifyWebhookSignature(body, ts, "abc", secret, now), "short signature");

// Credit estimate: 2 credits per rendered frame (Magic Hour: 48 credits/s at 24 fps).
assert.equal(estimateCredits(1, "FULL", 24), 48, "matches Magic Hour's published rate");
assert.equal(estimateCredits(1, "HALF", 30), 30, "matches our real 1s HALF jobs (30 charged)");
assert.equal(estimateCredits(1, "HALF", 29.97), 30, "29.97 fps rounds up to 15 frames");
assert.equal(estimateCredits(5, "FULL", 30), 300);
assert.equal(estimateCredits(1, "HALF"), 30, "unknown fps falls back to 30");

console.log("logic ok");

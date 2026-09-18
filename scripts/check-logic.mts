import assert from "node:assert/strict";
import { transformParamsSchema, uploadBodySchema } from "../src/lib/schemas";

const base = { start_seconds: 0, end_seconds: 3, style: { art_style: "Pixar" } };
const ok = (v: unknown) => transformParamsSchema.safeParse(v).success;

const parsed = transformParamsSchema.parse(base);
assert.equal(parsed.fps_resolution, "HALF");
assert.equal(parsed.style.model, "default");

assert.ok(!ok({ ...base, end_seconds: 0 }), "end must be > start");
assert.ok(!ok({ ...base, start_seconds: 3 }), "end == start rejected");
assert.ok(!ok({ ...base, style: { art_style: "Nope" } }), "unknown art style");
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

console.log("schemas ok");

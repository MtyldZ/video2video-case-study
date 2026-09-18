import type { ObjectId } from "mongodb";
import { z } from "zod";
import { transformations } from "@/lib/db";
import { env } from "@/lib/env";
import { createVideoToVideo, MagicHourError } from "@/lib/magichour";
import { transformBodySchema } from "@/lib/schemas";
import { getOrCreateUid } from "@/lib/uid";

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Maps Magic Hour failures to what the user can act on. Auth errors are our config problem, not theirs.
function magicHourFailure(e: MagicHourError): [number, string] {
  if (e.status === 400 || e.status === 422) return [400, `Invalid parameters: ${e.message}`];
  if (e.status === 402) return [402, "Not enough Magic Hour credits to run this transformation."];
  if (e.status === 429) return [429, "Too many requests. Please wait a moment and try again."];
  if (e.status === 401 || e.status === 403) return [500, "Transformation service is misconfigured."];
  return [502, "Transformation service is unavailable. Please try again."];
}

// Creates a transformation record, then submits the job to Magic Hour.
// Magic Hour reports the result to /api/webhook (registered in its dashboard), matched by job id.
export async function POST(req: Request) {
  const body = transformBodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return fail(400, z.prettifyError(body.error));
  const { source, params } = body.data;

  if (!new URL(source.url).pathname.startsWith(`/${env().CLOUDINARY_CLOUD_NAME}/video/upload/`)) {
    return fail(400, "Source video must be uploaded through this app first.");
  }

  const uid = await getOrCreateUid();
  const now = new Date();
  // Record first: if Magic Hour succeeds but the DB write failed afterwards, the paid job would be orphaned.
  let col: Awaited<ReturnType<typeof transformations>>;
  let insertedId: ObjectId;
  try {
    col = await transformations();
    ({ insertedId } = await col.insertOne({
      uid,
      status: "pending",
      sourceUrl: source.url,
      sourcePublicId: source.publicId,
      params,
      createdAt: now,
      updatedAt: now,
    }));
  } catch (e) {
    console.error("DB insert failed", e);
    return fail(503, "Database is unavailable. Please try again shortly.");
  }

  try {
    const job = await createVideoToVideo(params, source.url);
    await col.updateOne(
      { _id: insertedId },
      { $set: { status: "processing", mhJobId: job.id, creditsCharged: job.credits_charged, updatedAt: new Date() } },
    );
    return Response.json({ id: insertedId.toString(), status: "processing" }, { status: 202 });
  } catch (e) {
    const [status, message] = e instanceof MagicHourError ? magicHourFailure(e) : [502, "Could not start the transformation."];
    console.error("Magic Hour submit failed", e);
    await col.updateOne({ _id: insertedId }, { $set: { status: "failed", error: message, updatedAt: new Date() } });
    return fail(status, message);
  }
}

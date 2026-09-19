import type { WithId } from "mongodb";
import { uploadVideoFromUrl } from "@/lib/cloudinary";
import { type TransformationDoc, transformations } from "@/lib/db";
import { getVideoProject, type VideoProject } from "@/lib/magichour";

const MINUTE = 60_000;
const CHECK_AFTER = 2 * MINUTE; // give the webhook a head start
const CHECK_EVERY = 1 * MINUTE; // max one Magic Hour poll per job per minute
export const TIMEOUT_MINUTES = 20;
const GIVE_UP_AFTER = 24 * 60 * MINUTE; // Magic Hour stops retrying webhooks after 24h

const FINAL = { $nin: ["complete", "failed"] as ("complete" | "failed")[] };

// Applies a Magic Hour project state to its record. Idempotent: safe for webhook retries and polling.
// `timed_out` is not final on purpose, so a late result still completes the record.
export async function applyProjectResult(project: VideoProject): Promise<"not_found" | "ignored" | "updated"> {
  const col = await transformations();
  const record = await col.findOne({ mhJobId: project.id });
  if (!record) return "not_found";
  if (record.status === "complete" || record.status === "failed") return "ignored";

  const filter = { _id: record._id, status: FINAL };
  const now = new Date();

  if (project.status === "complete") {
    const url = project.downloads?.[0]?.url;
    if (!url) {
      await col.updateOne(filter, { $set: { status: "failed", error: "Render finished without an output file.", updatedAt: now } });
      return "updated";
    }
    const result = await uploadVideoFromUrl(url, "results", project.id);
    await col.updateOne(filter, {
      $set: {
        status: "complete",
        resultUrl: result.url,
        resultPublicId: result.publicId,
        creditsCharged: project.credits_charged ?? record.creditsCharged,
        updatedAt: new Date(),
      },
      $unset: { error: "" },
    });
    return "updated";
  }

  if (project.status === "error" || project.status === "canceled") {
    const error = project.status === "canceled" ? "Canceled in Magic Hour." : (project.error?.message ?? "Render failed.");
    await col.updateOne(filter, {
      $set: { status: "failed", error, creditsCharged: project.credits_charged ?? record.creditsCharged, updatedAt: now },
    });
    return "updated";
  }

  return "ignored"; // draft / queued / rendering: nothing to record yet
}

// Fallback for missed webhooks (and local dev without a public URL): polls Magic Hour for unfinished
// jobs older than CHECK_AFTER, then marks them timed_out after TIMEOUT_MINUTES. timed_out jobs keep
// being polled (throttled) until GIVE_UP_AFTER, so a late result still lands. Returns true if anything changed.
export async function refreshStaleJobs(records: WithId<TransformationDoc>[]) {
  const now = Date.now();
  const col = await transformations();
  const stale = records.filter((r) => {
    const age = now - r.createdAt.getTime();
    return ["pending", "processing", "timed_out"].includes(r.status) && age > CHECK_AFTER && age < GIVE_UP_AFTER;
  });

  const changed = await Promise.all(
    stale.map(async (r) => {
      // Atomic claim so concurrent history requests don't poll the same job twice.
      const claim = await col.updateOne(
        { _id: r._id, $or: [{ checkedAt: { $exists: false } }, { checkedAt: { $lt: new Date(now - CHECK_EVERY) } }] },
        { $set: { checkedAt: new Date(now) } },
      );
      if (!claim.modifiedCount) return false;

      if (!r.mhJobId) {
        // Crashed between saving the record and submitting to Magic Hour.
        const res = await col.updateOne(
          { _id: r._id, status: "pending", mhJobId: { $exists: false } },
          { $set: { status: "failed", error: "The job was never submitted. Please try again.", updatedAt: new Date() } },
        );
        return res.modifiedCount > 0;
      }

      try {
        if ((await applyProjectResult(await getVideoProject(r.mhJobId))) === "updated") return true;
      } catch (e) {
        console.error("Status check failed", r.mhJobId, e);
      }

      if (r.status !== "timed_out" && now - r.createdAt.getTime() > TIMEOUT_MINUTES * MINUTE) {
        const res = await col.updateOne(
          { _id: r._id, status: { $in: ["pending", "processing"] } },
          {
            $set: {
              status: "timed_out",
              error: `No result after ${TIMEOUT_MINUTES} minutes. It may still finish: use Check again or reopen History later.`,
              updatedAt: new Date(),
            },
          },
        );
        return res.modifiedCount > 0;
      }
      return false;
    }),
  );
  return changed.some(Boolean);
}

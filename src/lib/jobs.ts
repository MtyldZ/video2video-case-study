import { uploadVideoFromUrl } from "@/lib/cloudinary";
import { transformations } from "@/lib/db";
import type { VideoProject } from "@/lib/magichour";

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

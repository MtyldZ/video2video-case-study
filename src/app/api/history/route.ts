import { transformations } from "@/lib/db";
import { refreshStaleJobs } from "@/lib/jobs";
import { getOrCreateUid } from "@/lib/uid";

// A stale job that completed may be copied to Cloudinary during this request.
export const maxDuration = 60;

// ponytail: fixed page of the newest 50; add cursor pagination (`_id < before`) if users outgrow it.
const LIMIT = 50;

// The current browser's transformations, newest first. Also runs the missed-webhook / timeout check.
export async function GET() {
  const uid = await getOrCreateUid();
  try {
    const col = await transformations();
    const find = () =>
      col.find({ uid }, { projection: { uid: 0, checkedAt: 0 } }).sort({ _id: -1 }).limit(LIMIT).toArray();

    let docs = await find();
    if (await refreshStaleJobs(docs)) docs = await find();

    // ObjectId and Date serialize to strings, matching HistoryItem.
    return Response.json({ items: docs });
  } catch (e) {
    console.error("History fetch failed", e);
    return Response.json({ error: "Could not load your history. Please try again." }, { status: 503 });
  }
}

import { MongoClient } from "mongodb";
import { env } from "@/lib/env";
import type { Transformation } from "@/lib/schemas";

// `_id` is left to the driver (ObjectId); reads return WithId<TransformationDoc>.
export type TransformationDoc = Omit<Transformation, "_id">;

// Reuse one client across hot reloads (dev) and warm serverless invocations.
const g = globalThis as unknown as { mongo?: Promise<MongoClient> };

async function connect() {
  const client = await new MongoClient(env().MONGODB_URI).connect();
  const col = client.db(env().MONGODB_DB).collection<TransformationDoc>("transformations");
  await col.createIndexes([
    { key: { uid: 1, createdAt: -1 } },
    { key: { mhJobId: 1 }, unique: true, sparse: true },
  ]);
  return client;
}

export async function transformations() {
  g.mongo ??= connect().catch((e) => {
    g.mongo = undefined; // allow retry on next request
    throw e;
  });
  return (await g.mongo).db(env().MONGODB_DB).collection<TransformationDoc>("transformations");
}

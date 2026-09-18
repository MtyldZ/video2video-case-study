// Verifies credentials in .env.local reach MongoDB, Cloudinary and Magic Hour. Uses no credits.
import { transformations } from "../src/lib/db";
import { pingCloudinary } from "../src/lib/cloudinary";
import { getAccount } from "../src/lib/magichour";

const checks: [string, () => Promise<unknown>][] = [
  ["MongoDB", async () => (await transformations()).estimatedDocumentCount()],
  ["Cloudinary", pingCloudinary],
  ["Magic Hour", getAccount],
];

let failed = false;
for (const [name, run] of checks) {
  try {
    await run();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed = true;
    console.log(`✗ ${name}: ${e instanceof Error ? e.message : e}`);
  }
}
process.exit(failed ? 1 : 0);

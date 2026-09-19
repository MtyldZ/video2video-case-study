import { getAccount } from "@/lib/magichour";

// Remaining Magic Hour credits of the app's account (shared by all users).
export async function GET() {
  try {
    const { credits } = await getAccount();
    return Response.json({ credits });
  } catch (e) {
    console.error("Credit balance fetch failed", e);
    return Response.json({ error: "Could not load the credit balance." }, { status: 502 });
  }
}

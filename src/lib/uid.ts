import { cookies } from "next/headers";

const COOKIE = "uid";

// Anonymous per-browser id that scopes history. Swap for a session user id if login is added.
// Only callable from Route Handlers / Server Functions (sets a cookie).
export async function getOrCreateUid() {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;

  const uid = crypto.randomUUID();
  store.set(COOKIE, uid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return uid;
}

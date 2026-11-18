// Works in both the edge middleware and Node route handlers (Web Crypto only).
export const SESSION_COOKIE = "owner_session";
/*
 * EDIT-POINT: LOGIN
 * How many days the owner stays logged in. The password itself is the
 * ADMIN_PASSWORD environment variable in Vercel, not in the code.
 */
export const SESSION_DAYS = 60;

function secret() {
  return process.env.AUTH_SECRET || "fallback:" + (process.env.ADMIN_PASSWORD || "changeme");
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken() {
  const exp = Date.now() + SESSION_DAYS * 86400_000;
  return `${exp}.${await hmac(String(exp))}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = await hmac(exp);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  // Only allow the default password while developing on your own computer.
  return process.env.NODE_ENV === "production" ? null : "changeme";
}

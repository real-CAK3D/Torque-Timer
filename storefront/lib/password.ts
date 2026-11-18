import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { adminPassword } from "./auth";
import { kv } from "./store";

// The owner's password. Set first in Vercel (ADMIN_PASSWORD); once changed in
// Settings it's stored here as a salted hash and the Vercel one is ignored.
type Hash = { salt: string; hash: string; changedAt: string };
const KEY = "ownerPassword";

export async function getPasswordHash() {
  try {
    return await kv.get<Hash>(KEY);
  } catch {
    return null;
  }
}

function hashOf(pw: string, salt: string) {
  return scryptSync(pw, salt, 64).toString("hex");
}

export async function checkPassword(pw: string): Promise<boolean | null> {
  const stored = await getPasswordHash();
  if (stored) {
    const a = Buffer.from(hashOf(pw, stored.salt), "hex");
    const b = Buffer.from(stored.hash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const expected = adminPassword();
  if (!expected) return null; // no password anywhere yet
  const a = Buffer.from(pw);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  await kv.set(KEY, { salt, hash: hashOf(pw, salt), changedAt: new Date().toISOString() } satisfies Hash);
}

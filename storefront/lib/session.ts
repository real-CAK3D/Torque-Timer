import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export async function isOwner() {
  const c = await cookies();
  return verifySessionToken(c.get(SESSION_COOKIE)?.value);
}

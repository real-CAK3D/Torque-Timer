import { NextResponse } from "next/server";
import { adminPassword, createSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const expected = adminPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "No owner password is set. Add ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy." },
      { status: 500 }
    );
  }
  if (typeof password !== "string" || password !== expected) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  return res;
}

import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { checkPassword } from "@/lib/password";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const ok = typeof password === "string" && password ? await checkPassword(password) : false;
  if (ok === null) {
    return NextResponse.json(
      { error: "No owner password is set. Add ADMIN_PASSWORD in Vercel > Settings > Environment Variables, then redeploy." },
      { status: 500 }
    );
  }
  if (!ok) {
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

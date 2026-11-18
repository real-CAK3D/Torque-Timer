import { NextResponse } from "next/server";
import { checkPassword, setPassword } from "@/lib/password";

export async function POST(req: Request) {
  const { current, next } = await req.json().catch(() => ({}));
  if (!(await checkPassword(String(current ?? "")))) return NextResponse.json({ error: "Your current password isn't right." }, { status: 400 });
  if (typeof next !== "string" || next.length < 10) return NextResponse.json({ error: "Use at least 10 characters for the new password." }, { status: 400 });
  await setPassword(next);
  return NextResponse.json({ ok: true });
}

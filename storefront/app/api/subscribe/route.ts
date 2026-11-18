import { NextResponse } from "next/server";
import { getSubscribers, saveSubscribers } from "@/lib/db";
import { isEmail, tooMany } from "@/lib/guard";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true });
  if (tooMany(req, 8)) return NextResponse.json({ error: "Please try again later." }, { status: 429 });
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!isEmail(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  const list = await getSubscribers();
  if (!list.some((s) => s.email === email)) {
    list.unshift({ email, createdAt: new Date().toISOString() });
    await saveSubscribers(list);
  }
  return NextResponse.json({ ok: true });
}

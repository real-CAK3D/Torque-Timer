import { NextResponse } from "next/server";
import { getMessages, newId, saveMessages } from "@/lib/db";
import { isEmail, tooMany } from "@/lib/guard";
import { notifyOwner } from "@/lib/push";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // bot trap
  if (tooMany(req)) return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  const name = String(b.name ?? "").trim().slice(0, 100);
  const email = String(b.email ?? "").trim().slice(0, 200);
  const message = String(b.message ?? "").trim().slice(0, 5000);
  if (!isEmail(email)) return NextResponse.json({ error: "Enter an email address so we can reply." }, { status: 400 });
  if (message.length < 2) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  const list = await getMessages();
  list.unshift({ id: newId(), createdAt: new Date().toISOString(), name, email, message, read: false });
  await saveMessages(list);
  await notifyOwner(`Message from ${name || email}`, message.slice(0, 120), "/admin/inbox");
  return NextResponse.json({ ok: true });
}

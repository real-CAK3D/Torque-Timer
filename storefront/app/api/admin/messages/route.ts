import { NextResponse } from "next/server";
import { getMessages, getSubscribers, saveMessages, saveSubscribers } from "@/lib/db";

// { action: "read", id? } marks one (or all) read; { action: "delete", id }; { action: "unsubscribe", email }
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.action === "unsubscribe") {
    await saveSubscribers((await getSubscribers()).filter((s) => s.email !== b.email));
    return NextResponse.json({ ok: true });
  }
  const list = await getMessages();
  if (b.action === "read") list.forEach((m) => (!b.id || m.id === b.id) && (m.read = true));
  if (b.action === "delete") return saveMessages(list.filter((m) => m.id !== b.id)).then(() => NextResponse.json({ ok: true }));
  await saveMessages(list);
  return NextResponse.json({ ok: true });
}

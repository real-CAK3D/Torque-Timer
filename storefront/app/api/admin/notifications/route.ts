import { NextResponse } from "next/server";
import { getNotifications, saveNotifications } from "@/lib/db";

export async function POST() {
  const list = await getNotifications();
  list.forEach((n) => (n.read = true));
  await saveNotifications(list);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await saveNotifications([]);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getPushSubs, savePushSubs, type PushSub } from "@/lib/db";
import { notifyOwner, pushConfigured } from "@/lib/push";

export async function POST(req: Request) {
  const b = await req.json();
  if (b.test) {
    if (!(await pushConfigured())) return NextResponse.json({ error: "Notification keys aren't set up yet." }, { status: 400 });
    await notifyOwner("Test notification", "Notifications are working on this device.", "/admin");
    return NextResponse.json({ ok: true });
  }
  const sub = b.subscription as PushSub;
  if (!sub?.endpoint || !sub.keys?.p256dh) return NextResponse.json({ error: "Bad subscription" }, { status: 400 });
  const subs = (await getPushSubs()).filter((s) => s.endpoint !== sub.endpoint);
  subs.push({ endpoint: sub.endpoint, keys: sub.keys, label: String(b.label ?? "").slice(0, 60) });
  await savePushSubs(subs);
  return NextResponse.json({ ok: true, devices: subs.length });
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json();
  await savePushSubs((await getPushSubs()).filter((s) => s.endpoint !== endpoint));
  return NextResponse.json({ ok: true });
}

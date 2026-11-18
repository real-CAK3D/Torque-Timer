import { NextResponse } from "next/server";
import Stripe from "stripe";
import webpush from "web-push";
import { checkFormat, KEY_DEFS, keyStatuses, removeKey, saveKey, validName } from "@/lib/keys";
import { syncStripeCatalog } from "@/lib/stripe-catalog";

async function test(envName: string, value: string): Promise<string | null> {
  if (envName === "STRIPE_SECRET_KEY") {
    try {
      await new Stripe(value).accounts.retrieve();
      return null;
    } catch (e) {
      return `Stripe didn't accept that key: ${(e as Error).message}`;
    }
  }
  if (envName === "RESEND_API_KEY") {
    const r = await fetch("https://api.resend.com/domains", { headers: { authorization: `Bearer ${value}` } }).catch(() => null);
    return r?.ok ? null : "Resend didn't accept that key.";
  }
  return null;
}

export async function GET() {
  return NextResponse.json(await keyStatuses());
}

// { action: "save", name, value } | { action: "remove", name } | { action: "test", name, value? } | { action: "vapid" }
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim().toUpperCase();
  try {
    if (b.action === "vapid") {
      const k = webpush.generateVAPIDKeys();
      await saveKey("NEXT_PUBLIC_VAPID_PUBLIC_KEY", k.publicKey);
      await saveKey("VAPID_PRIVATE_KEY", k.privateKey);
      return NextResponse.json({ ok: true, message: "Notification keys created. Turn on notifications under Settings." });
    }
    if (!validName(name)) return NextResponse.json({ error: "Key names use capital letters, numbers and underscores, like MY_SERVICE_KEY." }, { status: 400 });
    if (b.action === "remove") {
      await removeKey(name);
      return NextResponse.json({ ok: true, message: "Removed." });
    }
    const value = String(b.value ?? "").trim();
    const known = KEY_DEFS.some((d) => d.envName === name);
    const formatErr = known ? checkFormat(name, value) : value ? null : "Paste the key first.";
    if (formatErr) return NextResponse.json({ error: formatErr }, { status: 400 });
    const testErr = await test(name, value);
    if (b.action === "test") return testErr ? NextResponse.json({ error: testErr }, { status: 400 }) : NextResponse.json({ ok: true, message: "That key works." });
    if (testErr) return NextResponse.json({ error: testErr }, { status: 400 });
    await saveKey(name, value);
    let message = "Saved.";
    if (name === "STRIPE_SECRET_KEY") {
      try {
        const c = await syncStripeCatalog();
        message = `Saved. Stripe connected and ${c.added + c.updated} product${c.added + c.updated === 1 ? "" : "s"} pulled in. Next: press "Connect Stripe webhook".`;
      } catch {
        message = 'Saved. Next: press "Connect Stripe webhook".';
      }
    }
    return NextResponse.json({ ok: true, message });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

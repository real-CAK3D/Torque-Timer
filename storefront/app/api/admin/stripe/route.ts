import { NextResponse } from "next/server";
import { saveKey } from "@/lib/keys";
import { siteUrl, stripe, WEBHOOK_EVENTS } from "@/lib/stripe";
import { listDiscounts, syncStripeCatalog } from "@/lib/stripe-catalog";

// { action: "sync" } pulls products from Stripe
// { action: "webhook" } creates the Stripe webhook for this site and saves its secret
// { action: "discounts" } lists promotion codes and coupons
export async function POST(req: Request) {
  const { action } = await req.json().catch(() => ({}));
  try {
    if (action === "sync") {
      const c = await syncStripeCatalog();
      return NextResponse.json({ ok: true, message: `Synced from Stripe: ${c.added} new, ${c.updated} updated, ${c.hidden} hidden.` });
    }
    if (action === "discounts") return NextResponse.json(await listDiscounts());
    if (action === "webhook") {
      const s = await stripe();
      if (!s) return NextResponse.json({ error: "Save your Stripe secret key first." }, { status: 400 });
      const base = siteUrl(req);
      if (!base.startsWith("https://") || /localhost|127\.0\.0\.1/.test(base)) {
        return NextResponse.json({ error: "Stripe can only reach the live site. Do this from your Vercel web address, not your own computer." }, { status: 400 });
      }
      const url = `${base}/api/stripe/webhook`;
      // Replace any old endpoint for this address (Stripe only reveals the secret when it's created).
      for await (const ep of s.webhookEndpoints.list({ limit: 100 })) {
        if (ep.url === url) await s.webhookEndpoints.del(ep.id);
      }
      const ep = await s.webhookEndpoints.create({ url, enabled_events: WEBHOOK_EVENTS, description: "Shop website (orders, refunds, product changes)" });
      if (!ep.secret) return NextResponse.json({ error: "Stripe didn't return a signing secret. Try again." }, { status: 500 });
      await saveKey("STRIPE_WEBHOOK_SECRET", ep.secret);
      return NextResponse.json({ ok: true, message: `Webhook connected: ${url}` });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

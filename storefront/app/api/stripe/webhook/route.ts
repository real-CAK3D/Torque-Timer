import { NextResponse } from "next/server";
import { getOrders, saveOrders } from "@/lib/db";
import { recordOrderFromSession } from "@/lib/orders";
import { notifyOwner } from "@/lib/push";
import { getKey } from "@/lib/keys";
import { stripe } from "@/lib/stripe";
import { syncStripeProduct } from "@/lib/stripe-catalog";

// Stripe calls this address when someone pays, a refund happens, or a product changes.
// The events it listens for are listed in WEBHOOK_EVENTS (lib/stripe.ts).
export async function POST(req: Request) {
  const s = await stripe();
  const secret = await getKey("STRIPE_WEBHOOK_SECRET");
  if (!s || !secret) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = await req.text();
  let event;
  try {
    event = s.webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await recordOrderFromSession(event.data.object.id);
  }
  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const sessions = await s.checkout.sessions.list({ payment_intent: String(charge.payment_intent), limit: 1 });
    const id = sessions.data[0]?.id;
    if (id) {
      const orders = await getOrders();
      const o = orders.find((x) => x.id === id);
      if (o && charge.refunded) {
        o.status = "refunded";
        await saveOrders(orders);
        await notifyOwner(`Order #${o.number} refunded`, `${o.name || o.email}`, `/admin/orders?open=${o.id}`);
      }
    }
  }
  if (event.type === "product.created" || event.type === "product.updated") {
    await syncStripeProduct(event.data.object.id);
  }
  if (event.type === "product.deleted") {
    await syncStripeProduct(event.data.object.id, true);
  }
  if (event.type === "price.created" || event.type === "price.updated") {
    const product = event.data.object.product;
    await syncStripeProduct(typeof product === "string" ? product : product.id);
  }
  return NextResponse.json({ received: true });
}

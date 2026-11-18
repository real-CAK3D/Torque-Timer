import { NextResponse } from "next/server";
import { getOrders, saveOrders } from "@/lib/db";
import { recordOrderFromSession } from "@/lib/orders";
import { notifyOwner } from "@/lib/push";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
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
  return NextResponse.json({ received: true });
}

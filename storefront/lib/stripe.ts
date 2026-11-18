import "server-only";
import Stripe from "stripe";
import { getKey } from "./keys";

let client: { key: string; s: Stripe } | null = null;

export async function stripe(): Promise<Stripe | null> {
  const key = await getKey("STRIPE_SECRET_KEY");
  if (!key) return null;
  if (client?.key !== key) client = { key, s: new Stripe(key) };
  return client.s;
}

export function siteUrl(req?: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (req) {
    const h = req.headers;
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

// keep in sync with app/api/stripe/webhook/route.ts
export const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "charge.refunded",
  "product.created",
  "product.updated",
  "product.deleted",
  "price.created",
  "price.updated",
];

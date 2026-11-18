import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getActiveProducts, getSettings } from "@/lib/db";
import { siteUrl, stripe } from "@/lib/stripe";

type CartLine = { productId: string; quantity: number; option?: string };

export async function POST(req: Request) {
  const s = await stripe();
  if (!s) return NextResponse.json({ error: "Online checkout isn't switched on yet. Please check back soon." }, { status: 503 });

  const { items } = (await req.json().catch(() => ({ items: [] }))) as { items: CartLine[] };
  const [products, settings] = await Promise.all([getActiveProducts(), getSettings()]);
  if (!settings.storeOpen) return NextResponse.json({ error: settings.closedMessage }, { status: 400 });

  const lines: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let subtotal = 0;
  const cart: [string, string][] = []; // [productId, choice] per line, so orders map back to items
  for (const it of Array.isArray(items) ? items.slice(0, 50) : []) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) continue;
    let qty = Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1)));
    if (p.stock !== null) qty = Math.min(qty, p.stock);
    if (qty <= 0) return NextResponse.json({ error: `${p.name} is sold out.` }, { status: 400 });
    const option = p.option && it.option && p.option.values.includes(it.option) ? it.option : "";
    subtotal += p.price * qty;
    const absImages = p.images
      .slice(0, 1)
      .map((u) => (u.startsWith("http") ? u : siteUrl(req) + u))
      .filter((u) => u.startsWith("https://"));
    cart.push([p.id, option]);
    const tax = settings.stripeTax ? { tax_behavior: "exclusive" as const } : {};
    lines.push({
      quantity: qty,
      price_data:
        p.stripeProductId && !option
          ? // Items made in Stripe are charged against that Stripe product, so Stripe's reports line up.
            { currency: settings.currency, unit_amount: p.price, product: p.stripeProductId, ...tax }
          : {
              currency: settings.currency,
              unit_amount: p.price,
              ...tax,
              product_data: {
                name: option ? `${p.name} (${option})` : p.name,
                description: p.summary || undefined,
                images: absImages.length ? absImages : undefined,
                metadata: { productId: p.id, option },
              },
            },
    });
  }
  if (!lines.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  const freeShip = settings.freeShippingOver > 0 && subtotal >= settings.freeShippingOver;
  const shippingAmount = settings.collectShipping && !freeShip ? settings.shippingFlat : 0;
  const base = siteUrl(req);

  try {
    /*
     * EDIT-POINT: CHECKOUT
     * Stripe Checkout options. Card, Apple Pay, Google Pay and Link are turned
     * on in the Stripe dashboard (Settings > Payment methods), not here.
     * Other options: https://docs.stripe.com/api/checkout/sessions/create
     */
    const session = await s.checkout.sessions.create({
      mode: "payment",
      line_items: lines,
      ...(settings.collectShipping
        ? {
            shipping_address_collection: { allowed_countries: (settings.shipCountries.length ? settings.shipCountries : ["US"]) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] },
            shipping_options: [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  display_name: freeShip ? "Free shipping" : "Standard shipping",
                  fixed_amount: { amount: shippingAmount, currency: settings.currency },
                  ...(settings.stripeTax ? { tax_behavior: "exclusive" as const } : {}),
                },
              },
            ],
          }
        : {}),
      phone_number_collection: { enabled: true },
      allow_promotion_codes: settings.allowPromoCodes || undefined,
      // needs Stripe Tax set up first (Stripe > Settings > Tax)
      ...(settings.stripeTax ? { automatic_tax: { enabled: true } } : {}),
      metadata: { cart: JSON.stringify(cart).slice(0, 499) },
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Checkout couldn't start. Please try again in a minute." }, { status: 500 });
  }
}

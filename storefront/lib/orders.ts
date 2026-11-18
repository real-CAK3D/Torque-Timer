import "server-only";
import type Stripe from "stripe";
import { addOrderOnce, getProducts, getSettings, saveProducts } from "./db";
import { money } from "./format";
import { notifyOwner } from "./push";
import { stripe } from "./stripe";
import type { OrderItem } from "./types";

// Safe to call twice for the same session; addOrderOnce dedupes.
export async function recordOrderFromSession(sessionId: string) {
  const s = await stripe();
  if (!s) return null;
  const session = await s.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product", "payment_intent.payment_method"],
  });
  if (session.payment_status !== "paid") return null;

  const items: OrderItem[] = [];
  let shipping = 0;
  let cart: [string, string][] = [];
  try {
    cart = JSON.parse(session.metadata?.cart ?? "[]");
  } catch {}
  const catalog = await getProducts();
  let lineIndex = 0;
  for (const li of session.line_items?.data ?? []) {
    const product = li.price?.product as Stripe.Product | undefined;
    const meta = product?.metadata ?? {};
    const fromCart = cart[lineIndex++] ?? [];
    const appProduct =
      catalog.find((p) => p.id === (meta.productId || fromCart[0])) ?? catalog.find((p) => product && p.stripeProductId === product.id);
    if (meta.kind === "shipping") {
      shipping += li.amount_total;
      continue;
    }
    items.push({
      productId: appProduct?.id ?? meta.productId ?? "",
      name: product?.name ?? li.description ?? "Item",
      option: meta.option || fromCart[1] || undefined,
      quantity: li.quantity ?? 1,
      unitAmount: li.price?.unit_amount ?? 0,
    });
  }
  shipping += session.shipping_cost?.amount_total ?? 0;
  let promoCode: string | undefined;
  const disc = session.discounts?.[0]?.promotion_code;
  if (disc) {
    try {
      promoCode = typeof disc === "string" ? (await s.promotionCodes.retrieve(disc)).code : disc.code;
    } catch {}
  }

  const ship = session.collected_information?.shipping_details ?? null;
  const addr = ship?.address ?? session.customer_details?.address ?? null;
  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  const pm = pi && typeof pi === "object" ? (pi.payment_method as Stripe.PaymentMethod | null) : null;
  const wallet = pm?.card?.wallet?.type;
  const paymentMethod = wallet
    ? wallet === "apple_pay" ? "Apple Pay" : wallet === "google_pay" ? "Google Pay" : wallet
    : pm?.card ? `${pm.card.brand} •••• ${pm.card.last4}` : pm?.type;

  const order = await addOrderOnce({
    id: session.id,
    createdAt: new Date((session.created ?? Date.now() / 1000) * 1000).toISOString(),
    email: session.customer_details?.email ?? "",
    name: ship?.name ?? session.customer_details?.name ?? "",
    phone: session.customer_details?.phone ?? undefined,
    shippingAddress: addr
      ? [addr.line1, addr.line2, `${addr.city ?? ""}, ${addr.state ?? ""} ${addr.postal_code ?? ""}`, addr.country]
          .filter(Boolean)
          .join("\n")
      : undefined,
    items,
    subtotal: session.amount_subtotal ?? 0,
    shipping,
    discount: session.total_details?.amount_discount || undefined,
    tax: session.total_details?.amount_tax || undefined,
    promoCode,
    total: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    paymentMethod: paymentMethod ?? undefined,
    status: "paid",
  });
  if (!order) return null; // already recorded

  // Reduce stock and warn when it's getting low
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const low: string[] = [];
  for (const it of items) {
    const p = products.find((x) => x.id === it.productId);
    if (p && p.stock !== null) {
      p.stock = Math.max(0, p.stock - it.quantity);
      if (p.stock <= settings.lowStockAlert) low.push(`${p.name} (${p.stock} left)`);
    }
  }
  await saveProducts(products);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  /*
   * EDIT-POINT: NOTIFICATION-TEXT
   * Wording of the phone notification sent for each new order and low stock.
   */
  await notifyOwner(
    `New order #${order.number}: ${money(order.total, order.currency)}`,
    `${order.name || order.email} bought ${count} item${count === 1 ? "" : "s"}.`,
    `/admin/orders?open=${order.id}`
  );
  if (low.length) await notifyOwner("Running low on stock", low.join(", "), "/admin/products");
  return order;
}

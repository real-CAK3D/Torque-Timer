import "server-only";
import type Stripe from "stripe";
import { getProducts, getSettings, saveProducts } from "./db";
import { cleanProduct, uniqueSlug } from "./products";
import { kv } from "./store";
import { stripe } from "./stripe";
import type { Product } from "./types";

/*
 *  EDIT-POINT: STRIPE-CATALOG
 *  Items made in Stripe (Product catalog > + Add product) appear in the shop.
 *
 *  Stripe controls: name, description, photos, price, and on/off (archived
 *  items are hidden). Optional extras go in the product's Metadata in Stripe:
 *    category        e.g. Woodwork
 *    summary         one line for the shop page
 *    stock           how many you have (the shop counts down from there)
 *    was_price       e.g. 45  (shows a sale)
 *    featured        true
 *    made_to_order   true
 *    choice_label    e.g. Color
 *    choice_options  e.g. Black, Brown, Natural
 *  Anything not set in Stripe can be set in the dashboard instead.
 */

const LAST_SYNC = "stripe:lastSync";

const yes = (v?: string) => /^(true|yes|1|y)$/i.test((v ?? "").trim());

function firstSentence(text: string) {
  const t = (text || "").trim().split(/\n/)[0];
  const m = t.match(/^(.{20,160}?[.!?])(\s|$)/);
  return (m ? m[1] : t).slice(0, 160);
}

function applyProduct(list: Product[], sp: Stripe.Product, currency: string): "added" | "updated" | "hidden" | "skipped" {
  const i = list.findIndex((p) => p.stripeProductId === sp.id);
  const existing = i >= 0 ? list[i] : undefined;
  const price = typeof sp.default_price === "object" && sp.default_price ? sp.default_price : null;
  const usable = price && price.type === "one_time" && price.unit_amount != null && price.currency === currency;

  if (!sp.active || (sp as unknown as { deleted?: boolean }).deleted || !usable) {
    if (existing && existing.active) {
      list[i] = { ...existing, active: false, updatedAt: new Date().toISOString() };
      return "hidden";
    }
    return "skipped";
  }

  const m = sp.metadata ?? {};
  const patch: Partial<Product> = {
    name: sp.name,
    description: sp.description ?? existing?.description ?? "",
    price: price!.unit_amount!,
    active: true,
    stripeProductId: sp.id,
  };
  if (sp.images?.length) patch.images = sp.images.slice(0, 12);
  if (m.summary) patch.summary = m.summary;
  else if (!existing?.summary) patch.summary = firstSentence(sp.description ?? "");
  if (m.category) patch.category = m.category;
  if (m.was_price) patch.compareAtPrice = Math.round(parseFloat(m.was_price) * 100) || null;
  if ("featured" in m) patch.featured = yes(m.featured);
  if ("made_to_order" in m) patch.madeToOrder = yes(m.made_to_order);
  if (m.choice_label && m.choice_options) patch.option = { label: m.choice_label, values: m.choice_options.split(",").map((x) => x.trim()).filter(Boolean) };
  // Stock: the shop counts it down after sales, so only take Stripe's number when it changes there.
  const stockNow = m.stock ?? null;
  if (stockNow !== (existing?.stripeStockSeen ?? null)) {
    patch.stock = stockNow === null || stockNow === "" ? null : Math.max(0, parseInt(stockNow, 10) || 0);
    patch.stripeStockSeen = stockNow;
  }

  if (existing) {
    const updated = cleanProduct({ ...existing, ...patch }, existing);
    updated.slug = existing.name === updated.name ? existing.slug : uniqueSlug(updated.name, list, updated.id);
    list[i] = updated;
    return "updated";
  }
  const created = cleanProduct({ featured: false, madeToOrder: false, category: "", images: [], ...patch });
  created.slug = uniqueSlug(created.name, list, created.id);
  list.push(created);
  return "added";
}

export async function syncStripeCatalog() {
  const s = await stripe();
  if (!s) throw new Error("Add your Stripe secret key first (Dashboard > Keys).");
  const [list, settings] = await Promise.all([getProducts(), getSettings()]);
  const counts = { added: 0, updated: 0, hidden: 0, skipped: 0 };
  const seen = new Set<string>();
  for await (const sp of s.products.list({ limit: 100, expand: ["data.default_price"] })) {
    seen.add(sp.id);
    counts[applyProduct(list, sp, settings.currency)]++;
  }
  // Deleted in Stripe: hide here (kept so past orders still make sense)
  for (const p of list) {
    if (p.stripeProductId && !seen.has(p.stripeProductId) && p.active) {
      p.active = false;
      counts.hidden++;
    }
  }
  await saveProducts(list);
  await kv.set(LAST_SYNC, new Date().toISOString());
  return counts;
}

export async function syncStripeProduct(productId: string, deleted = false) {
  const s = await stripe();
  if (!s) return;
  const [list, settings] = await Promise.all([getProducts(), getSettings()]);
  if (deleted) {
    const p = list.find((x) => x.stripeProductId === productId);
    if (p) p.active = false;
  } else {
    const sp = await s.products.retrieve(productId, { expand: ["default_price"] });
    applyProduct(list, sp, settings.currency);
  }
  await saveProducts(list);
  await kv.set(LAST_SYNC, new Date().toISOString());
}

export async function lastStripeSync() {
  return kv.get<string>(LAST_SYNC);
}

export type Discount = { id: string; code: string; label: string; uses: number; maxUses: number | null; expires: string | null; active: boolean };

export async function listDiscounts(): Promise<{ codes: Discount[]; coupons: { id: string; name: string; label: string; valid: boolean }[] }> {
  const s = await stripe();
  if (!s) return { codes: [], coupons: [] };
  const describe = (c: Stripe.Coupon) =>
    `${c.percent_off ? `${c.percent_off}% off` : c.amount_off ? `${(c.amount_off / 100).toFixed(2)} ${c.currency?.toUpperCase()} off` : "Discount"}${c.duration === "once" ? "" : ` (${c.duration})`}`;
  const [promos, coupons] = await Promise.all([
    s.promotionCodes.list({ limit: 100 }),
    s.coupons.list({ limit: 100 }),
  ]);
  return {
    codes: promos.data.map((p) => {
      const c = (p as unknown as { coupon?: Stripe.Coupon; promotion?: { coupon?: Stripe.Coupon | string } }).coupon ?? null;
      return {
        id: p.id,
        code: p.code,
        label: c ? describe(c) : "",
        uses: p.times_redeemed,
        maxUses: p.max_redemptions ?? null,
        expires: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null,
        active: p.active,
      };
    }),
    coupons: coupons.data.map((c) => ({ id: c.id, name: c.name ?? c.id, label: describe(c), valid: c.valid })),
  };
}

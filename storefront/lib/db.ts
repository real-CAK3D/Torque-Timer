import "server-only";
import { kv } from "./store";
import type { AppNotification, Expense, Order, Product, SiteSettings } from "./types";

/* ========================================================================
 * EDIT-POINT: DEFAULT-TEXT
 * Starting words and settings for a brand-new site (before the owner edits
 * anything). Once the owner saves in the dashboard, the saved values win.
 * New settings must also be added to SiteSettings in lib/types.ts.
 * ======================================================================== */
export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: "Your Business Name",
  tagline: "Veteran-owned. Handmade with discipline.",
  logo: "",
  emblem: "",
  favicon: "",
  heroImage: "",
  aboutImage: "",
  announcement: "Veteran owned and operated. Every order packed by hand.",
  heroHeadline: "Built to standard. Made by hand.",
  heroText:
    "Small-batch goods made in a home workshop by a U.S. Army Military Police veteran. Every piece gets the same attention to detail as a pre-inspection.",
  aboutTitle: "About the maker",
  about:
    "Tell your story here. Where you served, what you make, and why you make it.\n\nCustomers love knowing who is behind the work. A few short paragraphs is plenty.",
  serviceLine: "U.S. Army Military Police veteran",
  showVeteranBadge: true,
  shippingPolicy: "Orders ship within 3–5 business days. Made-to-order items may take a little longer; you'll get an email when yours ships.",
  returnPolicy: "If something isn't right, reach out within 30 days and we'll make it right.",
  contactEmail: "",
  contactPhone: "",
  location: "",
  social: {},
  theme: "military-police",
  layout: "garrison",
  currency: "usd",
  shippingFlat: 800,
  freeShippingOver: 7500,
  collectShipping: true,
  storeOpen: true,
  closedMessage: "The shop is on leave for a few days. Orders reopen soon.",
  lowStockAlert: 2,
  githubRepo: "",
  vercelProject: "",
  customLinks: [],
};

const now = () => new Date().toISOString();

/* ========================================================================
 * EDIT-POINT: SAMPLE-PRODUCTS
 * Demo items that appear the first time the site runs. Prices are in CENTS
 * (6500 = $65.00). Delete them from the dashboard, or empty this list.
 * ======================================================================== */
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "sample-1",
    slug: "challenge-coin-display",
    name: "Challenge Coin Display",
    price: 6500,
    compareAtPrice: null,
    summary: "Hardwood rack that holds 24 coins, finished by hand.",
    description:
      "Solid walnut with routed slots for 24 standard coins. Sanded to 320 grit and finished with three coats of oil.\n\nThis is a sample item. Edit or delete it from your dashboard.",
    category: "Woodwork",
    images: [],
    stock: 5,
    madeToOrder: false,
    featured: true,
    active: true,
    option: { label: "Wood", values: ["Walnut", "Oak", "Cherry"] },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "sample-2",
    slug: "flag-case",
    name: "Memorial Flag Case",
    price: 12000,
    compareAtPrice: 14000,
    summary: "Triangle case for a 5' × 9.5' burial flag.",
    description: "Glass-front triangle case with a hand-cut mitered frame. Engraving available on request.\n\nThis is a sample item.",
    category: "Woodwork",
    images: [],
    stock: null,
    madeToOrder: true,
    featured: true,
    active: true,
    option: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "sample-3",
    slug: "leather-keychain",
    name: "Leather Keychain",
    price: 1800,
    compareAtPrice: null,
    summary: "Stitched leather fob with a solid brass ring.",
    description: "Veg-tan leather, saddle stitched, edges burnished.\n\nThis is a sample item.",
    category: "Leather",
    images: [],
    stock: 20,
    madeToOrder: false,
    featured: false,
    active: true,
    option: { label: "Color", values: ["Natural", "Brown", "Black"] },
    createdAt: now(),
    updatedAt: now(),
  },
];

// ---------- settings ----------
export async function getSettings(): Promise<SiteSettings> {
  const s = await kv.get<Partial<SiteSettings>>("settings");
  return { ...DEFAULT_SETTINGS, ...(s ?? {}), social: { ...(s?.social ?? {}) } };
}

export async function saveSettings(patch: Partial<SiteSettings>) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await kv.set("settings", next);
  return next;
}

// ---------- products ----------
export async function getProducts(): Promise<Product[]> {
  const p = await kv.get<Product[]>("products");
  if (p === null) {
    await kv.set("products", SAMPLE_PRODUCTS);
    return SAMPLE_PRODUCTS;
  }
  return p;
}

export async function getActiveProducts() {
  return (await getProducts()).filter((p) => p.active);
}

export async function getProductBySlug(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function saveProducts(list: Product[]) {
  await kv.set("products", list);
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---------- orders ----------
export async function getOrders(): Promise<Order[]> {
  return (await kv.get<Order[]>("orders")) ?? [];
}

export async function saveOrders(list: Order[]) {
  await kv.set("orders", list);
}

/** Adds an order once (keyed by Stripe session id). Returns true if it was new. */
export async function addOrderOnce(order: Omit<Order, "number">): Promise<Order | null> {
  const orders = await getOrders();
  if (orders.some((o) => o.id === order.id)) return null;
  const number = (orders.reduce((m, o) => Math.max(m, o.number), 1000) || 1000) + 1;
  const full: Order = { ...order, number };
  orders.unshift(full);
  await saveOrders(orders);
  return full;
}

// ---------- expenses ----------
export async function getExpenses(): Promise<Expense[]> {
  return (await kv.get<Expense[]>("expenses")) ?? [];
}
export async function saveExpenses(list: Expense[]) {
  await kv.set("expenses", list);
}

// ---------- notifications ----------
export async function getNotifications(): Promise<AppNotification[]> {
  return (await kv.get<AppNotification[]>("notifications")) ?? [];
}
export async function saveNotifications(list: AppNotification[]) {
  await kv.set("notifications", list.slice(0, 200));
}

// ---------- analytics ----------
export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function trackView(opts: { productId?: string; newVisitor: boolean; referrer?: string }) {
  const day = dayKey();
  const jobs = [kv.hincrby("views", day, 1)];
  if (opts.newVisitor) jobs.push(kv.hincrby("visitors", day, 1));
  if (opts.productId) jobs.push(kv.hincrby("productViews", opts.productId, 1));
  if (opts.referrer) jobs.push(kv.hincrby("referrers", opts.referrer, 1));
  await Promise.all(jobs);
}

export async function getAnalytics() {
  const [views, visitors, productViews, referrers] = await Promise.all([
    kv.hgetall("views"),
    kv.hgetall("visitors"),
    kv.hgetall("productViews"),
    kv.hgetall("referrers"),
  ]);
  return { views, visitors, productViews, referrers };
}

// ---------- push subscriptions ----------
export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string }; label?: string };
export async function getPushSubs(): Promise<PushSub[]> {
  return (await kv.get<PushSub[]>("pushSubs")) ?? [];
}
export async function savePushSubs(list: PushSub[]) {
  await kv.set("pushSubs", list);
}

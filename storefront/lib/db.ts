import "server-only";
import { kv } from "./store";
import { fileSettings, syncVariables } from "./sync";
import type { AppNotification, Expense, Message, Order, Product, SiteSettings, Subscriber } from "./types";

// Starting values come from site-variables.ts (the SITE-VARIABLES edit point).
export const DEFAULT_SETTINGS: SiteSettings = fileSettings();

export async function getSettings(): Promise<SiteSettings> {
  await syncVariables();
  const s = await kv.get<Partial<SiteSettings>>("settings");
  return { ...DEFAULT_SETTINGS, ...(s ?? {}), social: { ...(s?.social ?? {}) } };
}

export async function saveSettings(patch: Partial<SiteSettings>) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await kv.set("settings", next);
  return next;
}

export async function getProducts(): Promise<Product[]> {
  await syncVariables();
  return (await kv.get<Product[]>("products")) ?? [];
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

export { newId, slugify } from "./ids";

export async function getOrders(): Promise<Order[]> {
  return (await kv.get<Order[]>("orders")) ?? [];
}

export async function saveOrders(list: Order[]) {
  await kv.set("orders", list);
}

// Returns null if we already have it (webhook and thank-you page both call this).
export async function addOrderOnce(order: Omit<Order, "number">): Promise<Order | null> {
  const orders = await getOrders();
  if (orders.some((o) => o.id === order.id)) return null;
  const number = (orders.reduce((m, o) => Math.max(m, o.number), 1000) || 1000) + 1;
  const full: Order = { ...order, number };
  orders.unshift(full);
  await saveOrders(orders);
  return full;
}

export async function getExpenses(): Promise<Expense[]> {
  return (await kv.get<Expense[]>("expenses")) ?? [];
}
export async function saveExpenses(list: Expense[]) {
  await kv.set("expenses", list);
}

export async function getNotifications(): Promise<AppNotification[]> {
  return (await kv.get<AppNotification[]>("notifications")) ?? [];
}
export async function saveNotifications(list: AppNotification[]) {
  await kv.set("notifications", list.slice(0, 200));
}

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

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string }; label?: string };
export async function getPushSubs(): Promise<PushSub[]> {
  return (await kv.get<PushSub[]>("pushSubs")) ?? [];
}
export async function savePushSubs(list: PushSub[]) {
  await kv.set("pushSubs", list);
}

export async function getMessages(): Promise<Message[]> {
  return (await kv.get<Message[]>("messages")) ?? [];
}
export async function saveMessages(list: Message[]) {
  await kv.set("messages", list.slice(0, 1000));
}
export async function getSubscribers(): Promise<Subscriber[]> {
  return (await kv.get<Subscriber[]>("subscribers")) ?? [];
}
export async function saveSubscribers(list: Subscriber[]) {
  await kv.set("subscribers", list);
}

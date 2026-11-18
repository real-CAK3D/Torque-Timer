import "server-only";
import { DEFAULT_SETTINGS, getExpenses, getProducts, getSettings, newId, saveExpenses, saveProducts, saveSettings } from "./db";
import { money } from "./format";
import { cleanProduct, uniqueSlug } from "./products";
import { kv } from "./store";
import { LAYOUTS, THEMES } from "./themes";
import type { Expense, Product, SiteSettings } from "./types";
import { EDIT_POINTS, EXPENSE_VARS, PRODUCT_VARS, SETTING_VARS } from "./variables";

/*
 * ============================================================================
 *  EDIT-POINT: CHATGPT-FORMAT
 *  The "shop-changes/v1" format ChatGPT sends back, and the brief that tells
 *  it how. All money is in DOLLARS in this format (the site stores cents).
 *
 *  {
 *    "format": "shop-changes/v1",
 *    "summary": "what changed, in plain words",
 *    "settings": { "tagline": "...", "shippingFlat": 6.5 },
 *    "products": {
 *      "add":    [ { "name": "...", "price": 30, ... } ],
 *      "update": [ { "slug": "leather-keychain", "price": 20 } ],
 *      "remove": [ "flag-case" ]
 *    },
 *    "expenses": { "add": [ { "date": "2026-11-01", "description": "Oak", "category": "Materials", "amount": 42 } ] }
 *  }
 * ============================================================================
 */

export const FORMAT = "shop-changes/v1";
const MONEY_SETTINGS = new Set(["shippingFlat", "freeShippingOver"]);
const BACKUP_KEY = "backup:beforeImport";

const dollars = (c: number | null | undefined) => (c == null ? null : Math.round(c) / 100);
const cents = (d: unknown) => Math.max(0, Math.round((Number(d) || 0) * 100));

function settingsForChat(s: SiteSettings) {
  const out: Record<string, unknown> = {};
  for (const v of SETTING_VARS) {
    const val = s[v.key as keyof SiteSettings];
    out[v.key] = MONEY_SETTINGS.has(v.key) ? dollars(val as number) : val;
  }
  return out;
}

function productForChat(p: Product) {
  return {
    slug: p.slug,
    name: p.name,
    price: dollars(p.price),
    compareAtPrice: dollars(p.compareAtPrice ?? null),
    summary: p.summary,
    description: p.description,
    category: p.category,
    stock: p.stock,
    madeToOrder: p.madeToOrder,
    featured: p.featured,
    active: p.active,
    option: p.option ?? null,
    images: p.images,
  };
}

/** The text the owner copies into ChatGPT. */
export function buildBrief(s: SiteSettings, products: Product[]) {
  const varLines = SETTING_VARS.map((v) => {
    const choices =
      v.key === "theme" ? THEMES.map((t) => `"${t.id}" (${t.name}: ${t.description})`).join(", ")
      : v.key === "layout" ? LAYOUTS.map((l) => `"${l.id}" (${l.name}: ${l.description})`).join(", ")
      : "";
    return `- ${v.key} [${v.kind}] ${v.what}${choices ? ` Allowed: ${choices}` : ""}`;
  }).join("\n");
  const prodLines = PRODUCT_VARS.map((v) => `- ${v.key}: ${v.what}`).join("\n");

  return `You are helping me update my online shop, "${s.businessName}". I am not a programmer. I will tell you what I want changed, and you reply with a block of JSON that I paste into my shop's "ChatGPT helper" page. The site reads that JSON and applies it. You never need the website's code.

## Rules for your reply
1. Reply with a short plain-English summary, then ONE \`\`\`json code block in the exact format below. Nothing else needs to be in the code block.
2. Only include what changes. Leave out anything that stays the same.
3. Money is in dollars (25 or 25.50), never cents.
4. Point at existing items by their "slug". Never invent slugs for new items.
5. Do not invent image URLs. If I want new photos, tell me to upload them in the dashboard (Products > the item > Add photos, or Words & logos for logos).
6. Use \\n\\n for a paragraph break inside long text.
7. If I ask for something these fields can't do (new page sections, different checkout behavior, new kinds of settings), say it needs a code change and name the closest EDIT-POINT from this list:\n${EDIT_POINTS.map((e) => `   - ${e.name} (${e.file}): ${e.what}`).join("\n")}\n   Tell me to search the code for "EDIT-POINT: NAME", show the exact lines to paste, and remind me that the change goes live after it's committed to GitHub (Vercel redeploys on its own).
8. Removing an item deletes it. If I might want it back, set "active": false instead and tell me.

## Reply format
\`\`\`json
{
  "format": "${FORMAT}",
  "summary": "One sentence describing the change",
  "settings": { "fieldName": "new value" },
  "products": {
    "add": [ { "name": "New item", "price": 30, "summary": "...", "description": "...", "category": "...", "stock": 5 } ],
    "update": [ { "slug": "existing-slug", "price": 35 } ],
    "remove": [ "slug-to-delete" ]
  },
  "expenses": { "add": [ { "date": "YYYY-MM-DD", "description": "...", "category": "Materials", "amount": 12.5 } ] }
}
\`\`\`
Any of "settings", "products" (and each of add/update/remove), or "expenses" can be left out.

## Site settings you can change
${varLines}

## Product fields
${prodLines}

## Expenses
- ${EXPENSE_VARS}
Today is ${new Date().toISOString().slice(0, 10)}.

## Current settings
\`\`\`json
${JSON.stringify(settingsForChat(s), null, 2)}
\`\`\`

## Current products (${products.length})
\`\`\`json
${JSON.stringify(products.map(productForChat), null, 2)}
\`\`\`

Reply "Ready" and wait for my first request.`;
}

/** Pulls the JSON out of whatever was pasted (a whole ChatGPT reply is fine). */
export function parseChanges(text: string): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const t = (text || "").trim();
  if (!t) return { ok: false, error: "Paste ChatGPT's reply first." };
  const blocks = [...t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((m) => m[1]);
  const candidates = [...blocks.reverse(), t, t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)];
  for (const c of candidates) {
    try {
      const data = JSON.parse(c.replace(/[“”]/g, '"'));
      if (data && typeof data === "object" && !Array.isArray(data) && (data.settings || data.products || data.expenses)) return { ok: true, data };
    } catch {}
  }
  return { ok: false, error: "Couldn't find the changes in that text. Copy ChatGPT's whole reply, including the part that starts with ```json." };
}

export type PreviewLine = { area: string; label: string; from?: string; to?: string; kind: "add" | "change" | "remove" };

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "(empty)";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return s.length > 140 ? s.slice(0, 137) + "…" : s;
};

/** Works out exactly what would change, without saving anything. */
export async function planChanges(data: Record<string, unknown>) {
  const [settings, products, expenses] = await Promise.all([getSettings(), getProducts(), getExpenses()]);
  const lines: PreviewLine[] = [];
  const warnings: string[] = [];
  if (data.format && data.format !== FORMAT) warnings.push(`Unknown format "${String(data.format)}". Applying what matches.`);

  // ---- settings
  const nextSettings: SiteSettings = { ...settings, social: { ...settings.social } };
  const sIn = (data.settings ?? {}) as Record<string, unknown>;
  for (const [k, raw] of Object.entries(sIn)) {
    const doc = SETTING_VARS.find((v) => v.key === k);
    if (!doc) { warnings.push(`Skipped unknown setting "${k}".`); continue; }
    let val: unknown = raw;
    const def = DEFAULT_SETTINGS[k as keyof SiteSettings];
    if (doc.kind === "money") val = cents(raw);
    else if (doc.kind === "number") val = Math.max(0, Math.round(Number(raw) || 0));
    else if (doc.kind === "yesno") val = raw === true || raw === "true" || raw === "yes";
    else if (doc.kind === "choice") {
      const ok = k === "theme" ? THEMES.some((t) => t.id === raw) : LAYOUTS.some((l) => l.id === raw);
      if (!ok) { warnings.push(`Skipped ${k}: "${String(raw)}" isn't one of the options.`); continue; }
    } else if (doc.kind === "image") {
      if (raw !== "" && !(typeof raw === "string" && /^https:\/\//.test(raw))) { warnings.push(`Skipped ${k}: images must be uploaded in the dashboard.`); continue; }
    } else if (doc.kind === "social") {
      if (typeof raw !== "object" || !raw) { warnings.push("Skipped social: expected an object of links."); continue; }
      const merged = { ...settings.social };
      for (const [net, url] of Object.entries(raw as Record<string, unknown>)) {
        if (!["facebook", "instagram", "tiktok", "youtube", "x", "etsy"].includes(net)) { warnings.push(`Skipped unknown social network "${net}".`); continue; }
        const u = String(url ?? "");
        if (u && !/^https?:\/\//.test(u)) { warnings.push(`Skipped ${net}: not a web address.`); continue; }
        (merged as Record<string, string>)[net] = u;
      }
      val = merged;
    } else if (doc.kind === "links") {
      if (!Array.isArray(raw)) { warnings.push("Skipped customLinks: expected a list."); continue; }
      val = raw.filter((l) => l && typeof l === "object").map((l) => ({ label: String(l.label ?? "").slice(0, 60), url: String(l.url ?? "").slice(0, 500) })).slice(0, 30);
    } else if (typeof def === "string") val = String(raw ?? "").slice(0, 8000);

    const before = settings[k as keyof SiteSettings];
    if (JSON.stringify(before) === JSON.stringify(val)) continue;
    (nextSettings as Record<string, unknown>)[k] = val;
    const fmt = (x: unknown) => (doc.kind === "money" ? money(x as number, settings.currency) : show(x));
    lines.push({ area: "Settings", label: k, from: fmt(before), to: fmt(val), kind: "change" });
  }

  // ---- products
  let nextProducts = [...products];
  const pIn = (data.products ?? {}) as { add?: unknown[]; update?: unknown[]; remove?: unknown[] };
  const toInternal = (raw: Record<string, unknown>, base?: Product): Partial<Product> => {
    const merged: Record<string, unknown> = base ? { ...base } : {};
    for (const [k, v] of Object.entries(raw)) {
      if (k === "slug" || k === "id") continue;
      if (!PRODUCT_VARS.some((x) => x.key === k)) { warnings.push(`Skipped unknown product field "${k}".`); continue; }
      if (k === "price") merged.price = cents(v);
      else if (k === "compareAtPrice") merged.compareAtPrice = v === null || v === "" ? null : cents(v);
      else if (k === "images") {
        const list = Array.isArray(v) ? v.filter((u) => typeof u === "string" && (/^https:\/\//.test(u) || (base?.images ?? []).includes(u))) : [];
        if (Array.isArray(v) && list.length !== v.length) warnings.push("Some image URLs were skipped. Upload photos in the dashboard.");
        merged.images = list;
      } else merged[k] = v;
    }
    return merged as Partial<Product>;
  };

  for (const raw of Array.isArray(pIn.remove) ? pIn.remove : []) {
    const slug = typeof raw === "string" ? raw : (raw as { slug?: string })?.slug;
    const p = nextProducts.find((x) => x.slug === slug);
    if (!p) { warnings.push(`Couldn't remove "${slug}": no item with that slug.`); continue; }
    nextProducts = nextProducts.filter((x) => x.id !== p.id);
    lines.push({ area: "Products", label: p.name, kind: "remove" });
  }
  for (const raw of Array.isArray(pIn.update) ? pIn.update : []) {
    const r = raw as Record<string, unknown>;
    const i = nextProducts.findIndex((x) => x.slug === r?.slug);
    if (i < 0) { warnings.push(`Couldn't update "${String(r?.slug)}": no item with that slug.`); continue; }
    const before = nextProducts[i];
    const after = cleanProduct(toInternal(r, before), before);
    after.slug = before.name === after.name ? before.slug : uniqueSlug(after.name, nextProducts, after.id);
    for (const f of PRODUCT_VARS.map((x) => x.key) as (keyof Product)[]) {
      if (f === "slug" || JSON.stringify(before[f] ?? null) === JSON.stringify(after[f] ?? null)) continue;
      const fmt = (x: unknown) => (f === "price" || f === "compareAtPrice" ? (x == null ? "(none)" : money(x as number, settings.currency)) : f === "images" ? `${(x as string[]).length} photo(s)` : show(x));
      lines.push({ area: before.name, label: f, from: fmt(before[f]), to: fmt(after[f]), kind: "change" });
    }
    nextProducts[i] = after;
  }
  for (const raw of Array.isArray(pIn.add) ? pIn.add : []) {
    const r = raw as Record<string, unknown>;
    if (!r?.name) { warnings.push("Skipped a new item with no name."); continue; }
    const p = cleanProduct(toInternal(r));
    p.slug = uniqueSlug(p.name, nextProducts, p.id);
    nextProducts.unshift(p);
    lines.push({ area: "Products", label: p.name, to: `${money(p.price, settings.currency)}${p.category ? ` · ${p.category}` : ""}`, kind: "add" });
  }

  // ---- expenses
  const newExpenses: Expense[] = [];
  for (const raw of Array.isArray((data.expenses as { add?: unknown[] })?.add) ? (data.expenses as { add: unknown[] }).add : []) {
    const r = raw as Record<string, unknown>;
    const amount = cents(r?.amount);
    if (!amount) { warnings.push("Skipped an expense with no amount."); continue; }
    const e: Expense = {
      id: newId(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(r.date)) ? String(r.date) : new Date().toISOString().slice(0, 10),
      description: String(r.description ?? "Expense").slice(0, 200),
      category: String(r.category ?? "Other").slice(0, 40),
      amount,
    };
    newExpenses.push(e);
    lines.push({ area: "Expenses", label: e.description, to: `${money(amount, settings.currency)} on ${e.date}`, kind: "add" });
  }

  return {
    summary: typeof data.summary === "string" ? data.summary.slice(0, 500) : "",
    lines,
    warnings: [...new Set(warnings)],
    apply: async () => {
      await kv.set(BACKUP_KEY, { at: new Date().toISOString(), settings, products, expenses });
      await Promise.all([
        saveSettings(nextSettings),
        saveProducts(nextProducts),
        newExpenses.length ? saveExpenses([...newExpenses, ...expenses].sort((a, b) => b.date.localeCompare(a.date))) : Promise.resolve(),
      ]);
    },
  };
}

type Backup = { at: string; settings: SiteSettings; products: Product[]; expenses: Expense[] };

export async function getBackupTime() {
  return (await kv.get<Backup>(BACKUP_KEY))?.at ?? null;
}

/** Puts settings, products and expenses back the way they were before the last import. */
export async function undoLastImport() {
  const b = await kv.get<Backup>(BACKUP_KEY);
  if (!b) return false;
  await Promise.all([saveSettings(b.settings), saveProducts(b.products), saveExpenses(b.expenses)]);
  await kv.set(BACKUP_KEY, null);
  return true;
}

import "server-only";
import { createHash } from "crypto";
import { SITE_VARIABLES } from "@/site-variables";
import { cleanProduct } from "./products";
import { kv } from "./store";
import type { Product, SiteSettings } from "./types";
import { type FileProduct, variablesToProducts, variablesToSettings } from "./variables-map";

/*
 * Applies site-variables.ts to the saved site data after each deploy.
 * Only values that changed in the file since the last deploy are applied, so
 * edits made in the dashboard survive unless the same value is changed in the file.
 */

const FILE_SETTINGS = variablesToSettings(SITE_VARIABLES);
const FILE_PRODUCTS = variablesToProducts(SITE_VARIABLES);
const FILE_HASH = createHash("sha1").update(JSON.stringify([FILE_SETTINGS, FILE_PRODUCTS])).digest("hex");
const APPLIED_KEY = "variables:applied";

type Applied = { hash: string; settings: SiteSettings; products: FileProduct[] };

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

let doneHash: string | null = null;
let running: Promise<void> | null = null;

export function fileSettings() {
  return FILE_SETTINGS;
}

export function syncVariables(): Promise<void> {
  if (doneHash === FILE_HASH) return Promise.resolve();
  running ??= run().finally(() => (running = null));
  return running;
}

async function run() {
  const prev = await kv.get<Applied>(APPLIED_KEY);
  if (prev?.hash === FILE_HASH) {
    doneHash = FILE_HASH;
    return;
  }

  // Settings: apply each value that is new or changed in the file
  const stored = (await kv.get<Partial<SiteSettings>>("settings")) ?? {};
  const settings: Partial<SiteSettings> = { ...stored };
  for (const k of Object.keys(FILE_SETTINGS) as (keyof SiteSettings)[]) {
    if (!prev || !same(prev.settings?.[k], FILE_SETTINGS[k])) (settings as Record<string, unknown>)[k] = FILE_SETTINGS[k];
  }

  // Products: add new ones, apply changed fields, remove ones taken out of the file
  let products = (await kv.get<Product[]>("products")) ?? [];
  const prevBySlug = new Map((prev?.products ?? []).map((p) => [p.slug, p]));
  for (const fp of FILE_PRODUCTS) {
    const before = prevBySlug.get(fp.slug);
    const i = products.findIndex((p) => p.slug === fp.slug);
    if (i < 0) {
      // New in the file, or deleted in the dashboard and then edited in the file again
      if (before && same(before, fp)) continue;
      const created = cleanProduct({ ...fp, images: fp.images ?? [] });
      created.slug = fp.slug;
      products.push(created);
      continue;
    }
    const changed: Partial<Product> = {};
    for (const k of Object.keys(fp) as (keyof FileProduct)[]) {
      if (k === "slug") continue;
      if (!before || !same(before[k], fp[k])) (changed as Record<string, unknown>)[k] = fp[k];
    }
    if (Object.keys(changed).length) {
      const updated = cleanProduct({ ...products[i], ...changed }, products[i]);
      updated.slug = products[i].slug;
      products[i] = updated;
    }
  }
  const fileSlugs = new Set(FILE_PRODUCTS.map((p) => p.slug));
  products = products.filter((p) => !(prevBySlug.has(p.slug) && !fileSlugs.has(p.slug)));

  await Promise.all([kv.set("settings", settings), kv.set("products", products)]);
  await kv.set(APPLIED_KEY, { hash: FILE_HASH, settings: FILE_SETTINGS, products: FILE_PRODUCTS } satisfies Applied);
  doneHash = FILE_HASH;
}

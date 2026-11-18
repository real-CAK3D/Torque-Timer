import { slugify } from "@/lib/format-slug";
import type { Product, SiteSettings } from "@/lib/types";

export type HomeProps = { s: SiteSettings; products: Product[] };
export type CatalogProps = { s: SiteSettings; products: Product[]; category: string | null; page: number };

export function byCategory(products: Product[]) {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const c = p.category || "Other";
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(p);
  }
  return [...map.entries()];
}

export const categoryHref = (c: string | null) => (c ? `/shop?category=${slugify(c)}` : "/shop");

/** Which items to show on a page of the catalog. */
export function slice(products: Product[], category: string | null, page: number, perPage: number) {
  const list = category ? products.filter((p) => slugify(p.category || "Other") === slugify(category)) : products;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(Math.max(1, page), pages);
  return { items: list.slice((current - 1) * perPage, current * perPage), pages, page: current, total: list.length };
}

/** Featured items for the home page, or the newest few if none are marked. */
export function featuredOf(products: Product[], max: number) {
  const f = products.filter((p) => p.featured);
  return (f.length ? f : products).slice(0, max);
}

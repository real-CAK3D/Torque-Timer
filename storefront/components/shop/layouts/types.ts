import type { Product, SiteSettings } from "@/lib/types";
export type HomeProps = { s: SiteSettings; products: Product[] };

export function byCategory(products: Product[]) {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const c = p.category || "Shop";
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(p);
  }
  return [...map.entries()];
}

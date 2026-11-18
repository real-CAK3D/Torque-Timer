import type { Metadata } from "next";
import { viewsFor } from "@/components/shop/layouts";
import { byCategory } from "@/components/shop/layouts/types";
import { Tracker } from "@/components/shop/Tracker";
import { getActiveProducts, getSettings } from "@/lib/db";
import { slugify } from "@/lib/format-slug";
import { getLayout } from "@/lib/themes";

type SP = { searchParams: Promise<{ category?: string; page?: string }> };

async function load(sp: Awaited<SP["searchParams"]>) {
  const [s, products] = await Promise.all([getSettings(), getActiveProducts()]);
  const category = sp.category ? byCategory(products).find(([c]) => slugify(c) === sp.category)?.[0] ?? null : null;
  return { s, products, category, page: Math.max(1, parseInt(sp.page ?? "1", 10) || 1) };
}

export async function generateMetadata({ searchParams }: SP): Promise<Metadata> {
  const { category } = await load(await searchParams);
  return { title: category ?? "Shop" };
}

export default async function ShopPage({ searchParams }: SP) {
  const d = await load(await searchParams);
  const layout = getLayout(d.s.layout).id;
  const { Catalog } = viewsFor(layout);
  return (
    <>
      <Tracker />
      <div className={`shop-page layout-${layout}`}>
        <Catalog s={d.s} products={d.products} category={d.category} page={d.page} />
      </div>
    </>
  );
}

import Link from "next/link";
import { AboutTeaser, CatalogHead, CategoryTabs, CategoryTiles, Pager, SeeAll } from "../CatalogParts";
import { Patch } from "../Logo";
import { ProductGrid } from "../ProductCard";
import { VeteranBadge } from "../Sections";
import { featuredOf, slice, type CatalogProps, type HomeProps } from "./types";

export function GarrisonHome({ s, products }: HomeProps) {
  return (
    <>
      <section className="hero hero-garrison">
        <Patch s={s} size={200} />
        <div className="hero-copy">
          <h1>{s.heroHeadline}</h1>
          <p className="lede">{s.heroText}</p>
          <div className="hero-actions">
            <Link href="/shop" className="btn btn-lg">Shop the collection</Link>
            <VeteranBadge s={s} />
          </div>
        </div>
      </section>
      <section className="section">
        <h2>{s.featuredHeading}</h2>
        <ProductGrid items={featuredOf(products, 8)} currency={s.currency} low={s.lowStockAlert} />
        {products.length > 8 ? <SeeAll /> : null}
      </section>
      <CategoryTiles products={products} />
      <AboutTeaser s={s} />
    </>
  );
}

export function GarrisonCatalog({ s, products, category, page }: CatalogProps) {
  const v = slice(products, category, page, 12);
  return (
    <section className="section catalog">
      <CatalogHead title={category ?? s.allItemsHeading} count={v.total} />
      <CategoryTabs products={products} current={category} />
      <ProductGrid items={v.items} currency={s.currency} low={s.lowStockAlert} />
      <Pager page={v.page} pages={v.pages} category={category} />
    </section>
  );
}

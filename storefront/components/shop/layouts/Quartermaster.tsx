import Link from "next/link";
import type { Product, SiteSettings } from "@/lib/types";
import { AddToCart } from "../AddToCart";
import { AboutTeaser, CatalogHead, CategoryTabs, CategoryTiles, Pager, SeeAll } from "../CatalogParts";
import { Price, StockNote } from "../Price";
import { ProductImage } from "../ProductImage";
import { VeteranBadge } from "../Sections";
import { featuredOf, slice, type CatalogProps, type HomeProps } from "./types";

function List({ s, items }: { s: SiteSettings; items: Product[] }) {
  if (!items.length) return <p className="empty">New items are on the way. Check back soon.</p>;
  return (
    <ul className="qm-list">
      {items.map((p) => (
        <li key={p.id} className="qm-row">
          <Link href={`/product/${p.slug}`} className="qm-thumb">
            <ProductImage p={p} />
          </Link>
          <div className="qm-info">
            <Link href={`/product/${p.slug}`}><strong>{p.name}</strong></Link>
            <span className="muted">{p.summary}</span>
          </div>
          <div className="qm-buy">
            <Price p={p} currency={s.currency} />
            <StockNote p={p} low={s.lowStockAlert} />
            {p.option ? (
              <Link href={`/product/${p.slug}`} className="btn btn-sm btn-ghost">Choose {p.option.label.toLowerCase()}</Link>
            ) : (
              <AddToCart compact productId={p.id} soldOut={p.stock === 0} storeOpen={s.storeOpen} />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function QuartermasterHome({ s, products }: HomeProps) {
  return (
    <>
      <section className="qm-head">
        <div>
          <h1>{s.heroHeadline}</h1>
          <p className="lede">{s.heroText}</p>
        </div>
        <VeteranBadge s={s} />
      </section>
      <section className="section qm-group">
        <h2>{s.featuredHeading}</h2>
        <List s={s} items={featuredOf(products, 8)} />
        {products.length > 8 ? <SeeAll label="Full list" /> : null}
      </section>
      <CategoryTiles products={products} />
      <AboutTeaser s={s} />
    </>
  );
}

export function QuartermasterCatalog({ s, products, category, page }: CatalogProps) {
  const v = slice(products, category, page, 24);
  return (
    <section className="section catalog qm-group">
      <CatalogHead title={category ?? s.allItemsHeading} count={v.total} />
      <CategoryTabs products={products} current={category} />
      <List s={s} items={v.items} />
      <Pager page={v.page} pages={v.pages} category={category} />
    </section>
  );
}

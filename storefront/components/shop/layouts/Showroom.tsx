import Link from "next/link";
import type { Product, SiteSettings } from "@/lib/types";
import { AboutTeaser, CatalogHead, CategoryTabs, CategoryTiles, Pager, SeeAll } from "../CatalogParts";
import { Patch } from "../Logo";
import { Price, StockNote } from "../Price";
import { ProductImage } from "../ProductImage";
import { featuredOf, slice, type CatalogProps, type HomeProps } from "./types";

function Rows({ s, items }: { s: SiteSettings; items: Product[] }) {
  if (!items.length) return <p className="empty">New items are on the way. Check back soon.</p>;
  return (
    <div className="show-list">
      {items.map((p, i) => (
        <article key={p.id} className={`show-row ${i % 2 ? "flip" : ""}`}>
          <Link href={`/product/${p.slug}`} className="show-media">
            <ProductImage p={p} />
          </Link>
          <div className="show-copy">
            {p.category ? <p className="muted">{p.category}</p> : null}
            <h2>
              <Link href={`/product/${p.slug}`}>{p.name}</Link>
            </h2>
            <p>{p.summary}</p>
            <div className="card-foot">
              <Price p={p} currency={s.currency} />
              <StockNote p={p} low={s.lowStockAlert} />
            </div>
            <Link href={`/product/${p.slug}`} className="btn btn-ghost">View details</Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ShowroomHome({ s, products }: HomeProps) {
  return (
    <>
      <section className={`hero-show ${s.heroImage ? "has-img" : ""}`} style={s.heroImage ? { backgroundImage: `url(${s.heroImage})` } : undefined}>
        <div className="hero-show-inner">
          <Patch s={s} size={110} />
          <h1>{s.heroHeadline}</h1>
          <p className="lede">{s.heroText}</p>
          <Link href="/shop" className="btn btn-lg">See the work</Link>
        </div>
      </section>
      <section className="section">
        <h2>{s.featuredHeading}</h2>
        <Rows s={s} items={featuredOf(products, 3)} />
        {products.length > 3 ? <SeeAll /> : null}
      </section>
      <CategoryTiles products={products} />
      <AboutTeaser s={s} />
    </>
  );
}

export function ShowroomCatalog({ s, products, category, page }: CatalogProps) {
  const v = slice(products, category, page, 6);
  return (
    <section className="section catalog">
      <CatalogHead title={category ?? s.allItemsHeading} count={v.total} />
      <CategoryTabs products={products} current={category} />
      <Rows s={s} items={v.items} />
      <Pager page={v.page} pages={v.pages} category={category} />
    </section>
  );
}

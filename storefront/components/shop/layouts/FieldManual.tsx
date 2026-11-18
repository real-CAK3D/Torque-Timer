import Link from "next/link";
import { slugify } from "@/lib/format-slug";
import type { Product, SiteSettings } from "@/lib/types";
import { AboutTeaser, CatalogHead, Pager, SeeAll } from "../CatalogParts";
import { Patch } from "../Logo";
import { ProductGrid } from "../ProductCard";
import { VeteranBadge } from "../Sections";
import { byCategory, categoryHref, featuredOf, slice, type CatalogProps, type HomeProps } from "./types";

function Shell({ s, products, current, children }: { s: SiteSettings; products: Product[]; current?: string | null; children: React.ReactNode }) {
  const groups = byCategory(products);
  const on = (c: string | null) => current !== undefined && (c ? slugify(c) === slugify(current ?? "") : current === null);
  return (
    <div className="fm">
      <aside className="fm-side">
        <Patch s={s} size={120} />
        <p className="fm-tag">{s.tagline}</p>
        <VeteranBadge s={s} />
        <nav aria-label="Sections" className="fm-nav">
          <Link href="/shop" className={on(null) ? "on" : ""}>Everything</Link>
          {groups.length > 1
            ? groups.map(([c, items]) => (
                <Link key={c} href={categoryHref(c)} className={on(c) ? "on" : ""}>
                  {c} <span className="muted">{items.length}</span>
                </Link>
              ))
            : null}
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </aside>
      <div className="fm-main">{children}</div>
    </div>
  );
}

export function FieldManualHome({ s, products }: HomeProps) {
  return (
    <Shell s={s} products={products}>
      <section className="fm-intro">
        <h1>{s.heroHeadline}</h1>
        <p className="lede">{s.heroText}</p>
      </section>
      <section className="section fm-section">
        <h2>{s.featuredHeading}</h2>
        <ProductGrid items={featuredOf(products, 6)} currency={s.currency} low={s.lowStockAlert} />
        {products.length > 6 ? <SeeAll /> : null}
      </section>
      <AboutTeaser s={s} />
    </Shell>
  );
}

export function FieldManualCatalog({ s, products, category, page }: CatalogProps) {
  const v = slice(products, category, page, 12);
  return (
    <Shell s={s} products={products} current={category}>
      <section className="fm-section catalog">
        <CatalogHead title={category ?? s.allItemsHeading} count={v.total} />
        <ProductGrid items={v.items} currency={s.currency} low={s.lowStockAlert} />
        <Pager page={v.page} pages={v.pages} category={category} />
      </section>
    </Shell>
  );
}

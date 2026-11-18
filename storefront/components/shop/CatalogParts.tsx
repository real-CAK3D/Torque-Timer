import Link from "next/link";
import { paragraphs } from "@/lib/format";
import { slugify } from "@/lib/format-slug";
import type { Product, SiteSettings } from "@/lib/types";
import { byCategory, categoryHref } from "./layouts/types";
import { ProductImage } from "./ProductImage";
import { VeteranBadge } from "./Sections";

export function CategoryTabs({ products, current }: { products: Product[]; current: string | null }) {
  const cats = byCategory(products);
  if (cats.length < 2) return null;
  const on = (c: string | null) => (c ? slugify(c) === slugify(current ?? "") : !current);
  return (
    <nav className="cat-tabs" aria-label="Categories">
      <Link href="/shop" className={on(null) ? "on" : ""} aria-current={on(null) ? "page" : undefined}>
        All <span>{products.length}</span>
      </Link>
      {cats.map(([c, items]) => (
        <Link key={c} href={categoryHref(c)} className={on(c) ? "on" : ""} aria-current={on(c) ? "page" : undefined}>
          {c} <span>{items.length}</span>
        </Link>
      ))}
    </nav>
  );
}

export function CategoryTiles({ products }: { products: Product[] }) {
  const cats = byCategory(products);
  if (cats.length < 2) return null;
  return (
    <section className="section">
      <h2>Shop by category</h2>
      <div className="tiles-grid">
        {cats.map(([c, items]) => {
          const cover = items.find((p) => p.images[0]) ?? items[0];
          return (
            <Link key={c} href={categoryHref(c)} className="cat-tile">
              <span className="cat-tile-media"><ProductImage p={cover} /></span>
              <span className="cat-tile-name">{c}</span>
              <span className="cat-tile-count">{items.length} item{items.length === 1 ? "" : "s"}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function AboutTeaser({ s }: { s: SiteSettings }) {
  const first = paragraphs(s.about)[0];
  if (!first) return null;
  return (
    <section className="section about-teaser">
      {s.aboutImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.aboutImage} alt="" className="about-teaser-img" />
      ) : null}
      <div>
        <h2>{s.aboutTitle}</h2>
        <p className="lede">{first}</p>
        <div className="hero-actions">
          <Link href="/about" className="btn btn-ghost">Read the story</Link>
          <VeteranBadge s={s} />
        </div>
      </div>
    </section>
  );
}

export function SeeAll({ label = "See everything" }: { label?: string }) {
  return (
    <p className="see-all">
      <Link href="/shop" className="btn btn-ghost">{label}</Link>
    </p>
  );
}

export function Pager({ page, pages, category }: { page: number; pages: number; category: string | null }) {
  if (pages < 2) return null;
  const href = (n: number) => {
    const q = new URLSearchParams();
    if (category) q.set("category", slugify(category));
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return `/shop${s ? `?${s}` : ""}`;
  };
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">Previous</Link> : <span />}
      <span className="pager-pages">
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
          n === page ? <span key={n} aria-current="page">{n}</span> : <Link key={n} href={href(n)}>{n}</Link>
        )}
      </span>
      {page < pages ? <Link href={href(page + 1)} rel="next">Next</Link> : <span />}
    </nav>
  );
}

export function CatalogHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="catalog-head">
      <h1>{title}</h1>
      <span className="muted">{count} item{count === 1 ? "" : "s"}</span>
    </div>
  );
}

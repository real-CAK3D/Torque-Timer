import Link from "next/link";
import { Patch } from "../Logo";
import { Price, StockNote } from "../Price";
import { ProductImage } from "../ProductImage";
import { About, Contact, VeteranBadge } from "../Sections";
import type { HomeProps } from "./types";

export function Showroom({ s, products }: HomeProps) {
  return (
    <>
      <section className={`hero-show ${s.heroImage ? "has-img" : ""}`} style={s.heroImage ? { backgroundImage: `url(${s.heroImage})` } : undefined}>
        <div className="hero-show-inner">
          <Patch s={s} size={110} />
          <h1>{s.heroHeadline}</h1>
          <p className="lede">{s.heroText}</p>
          <a href="#shop" className="btn btn-lg">See the work</a>
        </div>
      </section>
      <section id="shop" className="section show-list">
        {products.map((p, i) => (
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
        {!products.length ? <p className="empty">New items are on the way. Check back soon.</p> : null}
      </section>
      <div className="show-badge"><VeteranBadge s={s} /></div>
      <About s={s} />
      <Contact s={s} />
    </>
  );
}

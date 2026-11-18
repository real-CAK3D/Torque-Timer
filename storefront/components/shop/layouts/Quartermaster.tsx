import Link from "next/link";
import { AddToCart } from "../AddToCart";
import { Price, StockNote } from "../Price";
import { ProductImage } from "../ProductImage";
import { About, Contact, VeteranBadge } from "../Sections";
import { byCategory, type HomeProps } from "./types";

export function Quartermaster({ s, products }: HomeProps) {
  const groups = byCategory(products);
  return (
    <>
      <section className="qm-head">
        <div>
          <h1>{s.heroHeadline}</h1>
          <p className="lede">{s.heroText}</p>
        </div>
        <VeteranBadge s={s} />
      </section>
      <div id="shop" />
      {groups.map(([c, items]) => (
        <section key={c} className="section qm-group">
          <h2>{c}</h2>
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
        </section>
      ))}
      {!groups.length ? <p className="empty">New items are on the way. Check back soon.</p> : null}
      <About s={s} />
      <Contact s={s} />
    </>
  );
}

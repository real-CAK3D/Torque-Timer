import { ProductGrid } from "../ProductCard";
import { Patch } from "../Logo";
import { About, Contact, VeteranBadge } from "../Sections";
import type { HomeProps } from "./types";

export function Garrison({ s, products }: HomeProps) {
  const featured = products.filter((p) => p.featured);
  const rest = products.filter((p) => !p.featured);
  return (
    <>
      <section className="hero hero-garrison">
        <Patch s={s} size={200} />
        <div className="hero-copy">
          <h1>{s.heroHeadline}</h1>
          <p className="lede">{s.heroText}</p>
          <div className="hero-actions">
            <a href="#shop" className="btn btn-lg">Shop the collection</a>
            <VeteranBadge s={s} />
          </div>
        </div>
      </section>
      <div id="shop" />
      {featured.length ? (
        <section className="section">
          <h2>Featured</h2>
          <ProductGrid items={featured} currency={s.currency} low={s.lowStockAlert} />
        </section>
      ) : null}
      <section className="section">
        <h2>{featured.length ? "Everything else" : "Shop"}</h2>
        <ProductGrid items={featured.length ? rest : products} currency={s.currency} low={s.lowStockAlert} />
      </section>
      <About s={s} />
      <Contact s={s} />
    </>
  );
}

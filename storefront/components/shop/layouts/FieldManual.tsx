import { ProductGrid } from "../ProductCard";
import { Patch } from "../Logo";
import { About, Contact, VeteranBadge } from "../Sections";
import { byCategory, type HomeProps } from "./types";
import { slugify } from "@/lib/format-slug";

export function FieldManual({ s, products }: HomeProps) {
  const groups = byCategory(products);
  return (
    <div className="fm">
      <aside className="fm-side">
        <Patch s={s} size={120} />
        <p className="fm-tag">{s.tagline}</p>
        <VeteranBadge s={s} />
        <nav aria-label="Sections" className="fm-nav">
          {groups.map(([c]) => (
            <a key={c} href={`#cat-${slugify(c)}`}>{c}</a>
          ))}
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </aside>
      <div className="fm-main">
        <section className="fm-intro" id="shop">
          <h1>{s.heroHeadline}</h1>
          <p className="lede">{s.heroText}</p>
        </section>
        {groups.map(([c, items]) => (
          <section key={c} id={`cat-${slugify(c)}`} className="section fm-section">
            <h2>{c}</h2>
            <ProductGrid items={items} currency={s.currency} low={s.lowStockAlert} />
          </section>
        ))}
        {!groups.length ? <ProductGrid items={[]} currency={s.currency} low={0} /> : null}
        <About s={s} />
        <Contact s={s} />
      </div>
    </div>
  );
}

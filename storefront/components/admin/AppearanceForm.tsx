"use client";
import type { Layout, Theme } from "@/lib/themes";
import type { SiteSettings } from "@/lib/types";
import { useSettings } from "./useSettings";

export function AppearanceForm({ initial, themes, layouts }: { initial: SiteSettings; themes: Theme[]; layouts: Layout[] }) {
  const { s, set, bar } = useSettings(initial);
  const previewUrl = `/?theme=${s.theme}&layout=${s.layout}`;
  return (
    <>
      <div className="page-head">
        <h1>Look & layout</h1>
        <a className="b b-ghost" href={previewUrl} target="_blank" rel="noreferrer">Open preview</a>
      </div>
      <section className="panel">
        <div className="panel-head"><h2>Theme</h2></div>
        <div className="theme-grid" role="radiogroup" aria-label="Theme">
          {themes.map((t) => (
            <button key={t.id} role="radio" aria-checked={s.theme === t.id} className={`theme-card ${s.theme === t.id ? "on" : ""}`} onClick={() => set({ theme: t.id })}>
              <span className="theme-swatch" style={{ background: t.colors.bg }}>
                <span style={{ background: t.colors.band, color: t.colors.bandInk, borderBottom: `3px solid ${t.colors.stitch}`, fontFamily: t.fonts.display }}>Aa</span>
                <span className="sw-row">
                  <i style={{ background: t.colors.accent }} />
                  <i style={{ background: t.colors.stitch }} />
                  <i style={{ background: t.colors.surface2 }} />
                  <i style={{ background: t.colors.ink }} />
                </span>
              </span>
              <strong>{t.name}</strong>
              <span className="muted">{t.description}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-head"><h2>Page layout</h2></div>
        <div className="theme-grid" role="radiogroup" aria-label="Layout">
          {layouts.map((l) => (
            <button key={l.id} role="radio" aria-checked={s.layout === l.id} className={`theme-card ${s.layout === l.id ? "on" : ""}`} onClick={() => set({ layout: l.id })}>
              <pre className="sketch" aria-hidden>{l.sketch}</pre>
              <strong>{l.name}</strong>
              <span className="muted">{l.description}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel preview">
        <div className="panel-head"><h2>Preview</h2><span className="muted small">Customers keep seeing the saved look until you save.</span></div>
        <iframe key={previewUrl} src={previewUrl} title="Shop preview" loading="lazy" />
      </section>
      {bar}
    </>
  );
}

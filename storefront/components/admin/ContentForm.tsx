"use client";
import type { SiteSettings, SocialLinks } from "@/lib/types";
import { ImageField } from "./ImageField";
import { useSettings } from "./useSettings";

export function ContentForm({ initial }: { initial: SiteSettings }) {
  const { s, set, bar } = useSettings(initial);
  const text = (k: keyof SiteSettings, label: string, opts: { rows?: number; hint?: string; placeholder?: string } = {}) => (
    <label className="f">
      <span>{label}</span>
      {opts.rows ? (
        <textarea rows={opts.rows} value={String(s[k] ?? "")} onChange={(e) => set({ [k]: e.target.value } as Partial<SiteSettings>)} placeholder={opts.placeholder} />
      ) : (
        <input value={String(s[k] ?? "")} onChange={(e) => set({ [k]: e.target.value } as Partial<SiteSettings>)} placeholder={opts.placeholder} />
      )}
      {opts.hint ? <em className="hint">{opts.hint}</em> : null}
    </label>
  );
  const social = (k: keyof SocialLinks, label: string) => (
    <label className="f">
      <span>{label}</span>
      <input type="url" value={s.social[k] ?? ""} onChange={(e) => set({ social: { ...s.social, [k]: e.target.value } })} placeholder="https://" />
    </label>
  );
  return (
    <>
      <div className="page-head"><h1>Words & logos</h1></div>
      <div className="editor">
        <section className="panel stack">
          <h2>Business</h2>
          {text("businessName", "Business name")}
          {text("tagline", "Tagline", { hint: "Shows in search results and some layouts." })}
          {text("announcement", "Top banner message", { hint: "Leave empty to hide the banner." })}
          <h2>Welcome section</h2>
          {text("heroHeadline", "Headline")}
          {text("heroText", "Intro text", { rows: 3 })}
          <h2>About</h2>
          {text("aboutTitle", "About heading")}
          {text("about", "Your story", { rows: 8, hint: "Leave a blank line between paragraphs." })}
          {text("serviceLine", "Service line", { placeholder: "U.S. Army Military Police, 2004–2012" })}
          <label className="check"><input type="checkbox" checked={s.showVeteranBadge} onChange={(e) => set({ showVeteranBadge: e.target.checked })} /> Show the veteran-owned badge</label>
          <h2>Policies</h2>
          {text("shippingPolicy", "Shipping", { rows: 3 })}
          {text("returnPolicy", "Returns", { rows: 3 })}
        </section>
        <section className="panel stack">
          <h2>Logos & photos</h2>
          <ImageField label="Main logo" hint="Shown in the header and footer. A PNG with a transparent background works best." value={s.logo} onChange={(logo) => set({ logo })} folder="brand" shape="square" />
          <ImageField label="Patch / badge" hint="The round emblem on the welcome section. Uses the main logo if empty." value={s.emblem} onChange={(emblem) => set({ emblem })} folder="brand" shape="square" />
          <ImageField label="Browser tab icon" hint="Square image, at least 180 × 180." value={s.favicon} onChange={(favicon) => set({ favicon })} folder="brand" shape="square" />
          <ImageField label="Big welcome photo" hint="Used by the Showroom layout. Wide photos look best." value={s.heroImage} onChange={(heroImage) => set({ heroImage })} folder="brand" />
          <ImageField label="About photo" hint="A photo of you or the workshop." value={s.aboutImage} onChange={(aboutImage) => set({ aboutImage })} folder="brand" />
          <h2>Contact</h2>
          {text("contactEmail", "Email")}
          {text("contactPhone", "Phone")}
          {text("location", "Location", { placeholder: "e.g. Fort Leonard Wood, MO" })}
          <h2>Social links</h2>
          {social("facebook", "Facebook")}
          {social("instagram", "Instagram")}
          {social("tiktok", "TikTok")}
          {social("youtube", "YouTube")}
          {social("x", "X")}
          {social("etsy", "Etsy")}
        </section>
      </div>
      {bar}
    </>
  );
}

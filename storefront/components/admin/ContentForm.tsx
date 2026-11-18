"use client";
import type { SiteSettings, SocialLinks } from "@/lib/types";
import { ImageField } from "./ImageField";
import { Tabs } from "./Tabs";
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
      <p className="muted">These also live in <code>site-variables.ts</code> on GitHub. Whichever is changed most recently wins.</p>
      <Tabs
        label="Words and logos sections"
        tabs={[
          {
            id: "home",
            label: "Home page",
            content: (
              <section className="panel stack">
                <h2>Business</h2>
                {text("businessName", "Business name")}
                {text("tagline", "Tagline", { hint: "Shows in search results and the Field Manual sidebar." })}
                {text("announcement", "Top banner message", { hint: "Leave empty to hide the banner." })}
                <h2>Welcome section</h2>
                {text("heroHeadline", "Headline")}
                {text("heroText", "Intro text", { rows: 3 })}
                {text("featuredHeading", "Heading above featured items")}
                {text("allItemsHeading", "Shop page heading", { hint: "Shown at the top of the page that lists every item." })}
              </section>
            ),
          },
          {
            id: "about",
            label: "About page",
            content: (
              <section className="panel stack">
                {text("aboutTitle", "About heading")}
                {text("about", "Your story", { rows: 10, hint: "Leave a blank line between paragraphs. The first paragraph also shows on the home page." })}
                {text("serviceLine", "Service line", { placeholder: "U.S. Army Military Police, 2004-2012" })}
                <label className="check"><input type="checkbox" checked={s.showVeteranBadge} onChange={(e) => set({ showVeteranBadge: e.target.checked })} /> Show the veteran-owned badge</label>
              </section>
            ),
          },
          {
            id: "contact",
            label: "Contact page",
            content: (
              <section className="panel stack">
                {text("contactHeading", "Contact heading")}
                {text("contactText", "Contact intro")}
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
            ),
          },
          {
            id: "images",
            label: "Logos & photos",
            content: (
              <section className="panel image-grid">
                <ImageField label="Main logo" hint="Shown in the header and footer. A PNG with a transparent background works best." value={s.logo} onChange={(logo) => set({ logo })} folder="brand" shape="square" />
                <ImageField label="Patch / badge" hint="The round emblem on the home page. Uses the main logo if empty." value={s.emblem} onChange={(emblem) => set({ emblem })} folder="brand" shape="square" />
                <ImageField label="Browser tab icon" hint="Square image, at least 180 × 180." value={s.favicon} onChange={(favicon) => set({ favicon })} folder="brand" shape="square" />
                <ImageField label="Big welcome photo" hint="Used by the Showroom layout. Wide photos look best." value={s.heroImage} onChange={(heroImage) => set({ heroImage })} folder="brand" />
                <ImageField label="About photo" hint="A photo of you or the workshop." value={s.aboutImage} onChange={(aboutImage) => set({ aboutImage })} folder="brand" />
              </section>
            ),
          },
          {
            id: "policies",
            label: "Policies",
            content: (
              <section className="panel stack">
                {text("shippingPolicy", "Shipping", { rows: 3 })}
                {text("returnPolicy", "Returns", { rows: 3 })}
                {text("privacyPolicy", "Privacy policy", { rows: 6, hint: "Shown at /policies/privacy. {business} and {email} fill in automatically. A starting point, not legal advice." })}
                {text("termsOfService", "Terms of sale", { rows: 6, hint: "Shown at /policies/terms." })}
                <h2>Email sign-up</h2>
                {text("newsletterText", "Text next to the sign-up box", { hint: "Turn the box on or off in Settings." })}
              </section>
            ),
          },
        ]}
      />
      {bar}
    </>
  );
}

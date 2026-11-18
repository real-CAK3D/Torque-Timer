"use client";
import Link from "next/link";
import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { api } from "./api";
import { LogoutButton } from "./LogoutButton";
import { PushToggle } from "./PushToggle";
import { Tabs } from "./Tabs";
import { useSettings } from "./useSettings";

function PasswordForm() {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (f.next !== f.again) return setErr("The new passwords don't match.");
    try {
      await api("/api/admin/password", "POST", { current: f.current, next: f.next });
      setF({ current: "", next: "", again: "" });
      setMsg("Password changed. Use the new one next time you log in.");
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  return (
    <form className="stack" onSubmit={save}>
      <div className="row3">
        <label className="f"><span>Current password</span><input type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
        <label className="f"><span>New password</span><input type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></label>
        <label className="f"><span>New password again</span><input type="password" autoComplete="new-password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} /></label>
      </div>
      <div className="row wrap">
        <button className="b" disabled={!f.current || !f.next}>Change password</button>
        {msg ? <span role="status">{msg}</span> : null}
        {err ? <span className="err" role="alert">{err}</span> : null}
      </div>
      <p className="hint">At least 10 characters. Once changed here, the ADMIN_PASSWORD in Vercel is no longer used.</p>
    </form>
  );
}

export function SettingsForm({ initial, vapidKey, deviceCount, stripeTest, hasResend, repo }: { initial: SiteSettings; vapidKey: string; deviceCount: number; stripeTest: boolean; hasResend: boolean; repo: string }) {
  const { s, set, bar } = useSettings(initial);
  const dollars = (c: number) => (c / 100).toFixed(2);
  const cents = (v: string) => Math.round((parseFloat(v) || 0) * 100);
  const t = stripeTest ? "test/" : "";
  const accounts = [
    { name: "Stripe", note: "Payments, payouts, products, coupons", links: [["Dashboard", `https://dashboard.stripe.com/${t}dashboard`], ["Payments", `https://dashboard.stripe.com/${t}payments`], ["Products", `https://dashboard.stripe.com/${t}products`], ["Payouts", "https://dashboard.stripe.com/payouts"]] },
    { name: "Supabase", note: "Database and photo storage", links: [["Open Supabase", "https://supabase.com/dashboard/projects"]] },
    { name: "Vercel", note: "Hosting, domains, environment variables", links: [["Dashboard", "https://vercel.com/dashboard"]] },
    { name: "GitHub", note: repo ? repo : "The site's files and site-variables.ts", links: [["Open", repo ? `https://github.com/${repo}` : "https://github.com"], ...(repo ? [["site-variables.ts", `https://github.com/${repo}/blob/HEAD/site-variables.ts`]] : [])] },
  ];

  return (
    <>
      <div className="page-head"><h1>Settings</h1></div>
      <p className="muted">Store settings also live in <code>site-variables.ts</code> on GitHub. Whichever is changed most recently wins. API keys are on the <Link href="/admin/keys">Keys</Link> page.</p>

      <Tabs
        label="Settings sections"
        tabs={[
          { id: "store", label: "Store", content: (
        <>
        <section className="panel">
          <div className="panel-head"><h2>Store</h2></div>
          <div className="stack">
            <label className="check big"><input type="checkbox" checked={s.storeOpen} onChange={(e) => set({ storeOpen: e.target.checked })} /> Shop is open for orders</label>
            {!s.storeOpen ? <label className="f"><span>Message while closed</span><input value={s.closedMessage} onChange={(e) => set({ closedMessage: e.target.value })} /></label> : null}
            <div className="row2">
              <label className="check"><input type="checkbox" checked={s.collectShipping} onChange={(e) => set({ collectShipping: e.target.checked })} /> Ask for a shipping address</label>
              <label className="f"><span>Low-stock alert at</span><input inputMode="numeric" value={s.lowStockAlert} onChange={(e) => set({ lowStockAlert: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></label>
            </div>
            {s.collectShipping ? (
              <>
                <div className="row2">
                  <label className="f"><span>Flat shipping price</span><input inputMode="decimal" defaultValue={dollars(s.shippingFlat)} onBlur={(e) => set({ shippingFlat: cents(e.target.value) })} /></label>
                  <label className="f"><span>Free shipping on orders over <em className="muted">(0 = never)</em></span><input inputMode="decimal" defaultValue={dollars(s.freeShippingOver)} onBlur={(e) => set({ freeShippingOver: cents(e.target.value) })} /></label>
                </div>
                <label className="f"><span>Ship to countries <em className="muted">(two-letter codes, comma separated)</em></span><input defaultValue={s.shipCountries.join(", ")} onBlur={(e) => set({ shipCountries: e.target.value.split(",").map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)) })} /></label>
              </>
            ) : null}
          </div>
        </section>
  
          </>
          ) },
          { id: "checkout", label: "Checkout & emails", content: (
        <>
        <section className="panel">
          <div className="panel-head"><h2>Checkout & emails</h2></div>
          <div className="stack">
            <label className="check"><input type="checkbox" checked={s.allowPromoCodes} onChange={(e) => set({ allowPromoCodes: e.target.checked })} /> Let customers enter promo codes <Link href="/admin/discounts" className="small">Discounts</Link></label>
            <label className="check"><input type="checkbox" checked={s.stripeTax} onChange={(e) => set({ stripeTax: e.target.checked })} /> Sales tax by Stripe <a className="small" href="https://dashboard.stripe.com/settings/tax" target="_blank" rel="noreferrer">set up Stripe Tax first</a></label>
            <label className="check"><input type="checkbox" checked={s.showContactForm} onChange={(e) => set({ showContactForm: e.target.checked })} /> Contact form on the shop <Link href="/admin/inbox" className="small">Inbox</Link></label>
            <label className="check"><input type="checkbox" checked={s.showNewsletter} onChange={(e) => set({ showNewsletter: e.target.checked })} /> Email sign-up box in the footer</label>
            <label className="f">
              <span>Send customer emails from <em className="muted">(for tracking emails{hasResend ? "" : "; needs a Resend key"})</em></span>
              <input value={s.emailFrom} onChange={(e) => set({ emailFrom: e.target.value })} placeholder="Your Shop <orders@yourshop.com>" />
            </label>
          </div>
        </section>
  
          </>
          ) },
          { id: "notifications", label: "Notifications", content: (
        <>
        <section className="panel">
          <div className="panel-head"><h2>Notifications on this device</h2></div>
          <PushToggle vapidKey={vapidKey} configured={Boolean(vapidKey)} deviceCount={deviceCount} />
          <details className="howto">
            <summary>Put the dashboard on an iPhone home screen</summary>
            <ol>
              <li>Open this site&apos;s <strong>/admin</strong> address in Safari and log in.</li>
              <li>Tap the Share button, then <strong>Add to Home Screen</strong>.</li>
              <li>Open the new <strong>Shop HQ</strong> icon, come back to this page and tap <strong>Turn on notifications</strong>.</li>
            </ol>
            <p className="hint">iPhone only allows website notifications from apps added to the home screen (iOS 16.4 or newer).</p>
          </details>
        </section>
  
          </>
          ) },
          { id: "accounts", label: "Accounts & links", content: (
        <>
        <section className="panel">
          <div className="panel-head"><h2>Your accounts</h2><Link href="/admin/setup">Setup guide</Link></div>
          <div className="integrations">
            {accounts.map((a) => (
              <div key={a.name} className="integ">
                <div className="integ-head"><strong>{a.name}</strong></div>
                <p className="muted">{a.note}</p>
                <div className="row wrap">
                  {a.links.map(([label, url], i) => <a key={url} className={`b b-sm ${i ? "b-ghost" : ""}`} href={url} target="_blank" rel="noreferrer">{label}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div className="row2" style={{ marginTop: "1rem" }}>
            <label className="f"><span>GitHub repository <em className="muted">(owner/name, if not detected)</em></span><input value={s.githubRepo} onChange={(e) => set({ githubRepo: e.target.value })} placeholder="owner/repo" /></label>
            <label className="f"><span>Vercel project <em className="muted">(team/project)</em></span><input value={s.vercelProject} onChange={(e) => set({ vercelProject: e.target.value })} placeholder="my-team/my-shop" /></label>
          </div>
        </section>
  
          <section className="panel">
          <div className="panel-head"><h2>My links</h2></div>
          <p className="muted">Shortcuts to anything else you use: shipping labels, suppliers, your bank, an Etsy shop.</p>
          <ul className="linklist">
            {s.customLinks.map((l, i) => (
              <li key={i} className="row">
                <input aria-label="Link name" value={l.label} onChange={(e) => set({ customLinks: s.customLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Name" />
                <input aria-label="Link address" type="url" value={l.url} onChange={(e) => set({ customLinks: s.customLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://" />
                {l.url ? <a className="b b-sm" href={l.url} target="_blank" rel="noreferrer">Open</a> : null}
                <button type="button" className="b b-sm b-ghost" onClick={() => set({ customLinks: s.customLinks.filter((_, j) => j !== i) })}>Remove</button>
              </li>
            ))}
          </ul>
          <button type="button" className="b b-sm" onClick={() => set({ customLinks: [...s.customLinks, { label: "", url: "" }] })}>Add a link</button>
        </section>
  
          </>
          ) },
          { id: "password", label: "Password", content: (
        <>
        <section className="panel">
          <div className="panel-head"><h2>Password</h2></div>
          <PasswordForm />
        </section>
  
          <section className="panel">
          <div className="panel-head"><h2>Account</h2></div>
          <LogoutButton />
        </section>
          </>
          ) },
        ]}
      />
      {bar}
    </>
  );
}

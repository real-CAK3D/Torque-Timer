"use client";
import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";
import { PushToggle } from "./PushToggle";
import { useSettings } from "./useSettings";

type Status = { stripe: boolean; stripeLive: boolean; webhook: boolean; redis: boolean; blob: boolean; push: boolean; password: boolean; authSecret: boolean };

function Dot({ ok, label }: { ok: boolean; label?: string }) {
  return <span className={`dot ${ok ? "ok" : "no"}`}>{label ?? (ok ? "Connected" : "Not set up")}</span>;
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="copy">
      <code>{text}</code>
      <button type="button" className="b b-sm b-ghost" onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>{done ? "Copied" : "Copy"}</button>
    </span>
  );
}

export function SettingsForm({ initial, status, webhookUrl, siteUrl, vapidKey, deviceCount }: { initial: SiteSettings; status: Status; webhookUrl: string; siteUrl: string; vapidKey: string; deviceCount: number }) {
  const { s, set, bar } = useSettings(initial);
  const dollars = (c: number) => (c / 100).toFixed(2);
  const cents = (v: string) => Math.round((parseFloat(v) || 0) * 100);
  const repoUrl = s.githubRepo ? (s.githubRepo.startsWith("http") ? s.githubRepo : `https://github.com/${s.githubRepo}`) : "https://github.com";
  const vercelUrl = s.vercelProject ? (s.vercelProject.startsWith("http") ? s.vercelProject : `https://vercel.com/${s.vercelProject}`) : "https://vercel.com/dashboard";

  return (
    <>
      <div className="page-head"><h1>Settings</h1></div>
      <p className="muted">Store settings also live in <code>site-variables.ts</code> on GitHub. Whichever is changed most recently wins.</p>

      <section className="panel">
        <div className="panel-head"><h2>Store</h2></div>
        <div className="stack">
          <label className="check big"><input type="checkbox" checked={s.storeOpen} onChange={(e) => set({ storeOpen: e.target.checked })} /> Shop is open for orders</label>
          {!s.storeOpen ? (
            <label className="f"><span>Message while closed</span><input value={s.closedMessage} onChange={(e) => set({ closedMessage: e.target.value })} /></label>
          ) : null}
          <div className="row2">
            <label className="check"><input type="checkbox" checked={s.collectShipping} onChange={(e) => set({ collectShipping: e.target.checked })} /> Ask for a shipping address</label>
            <label className="f"><span>Low-stock alert at</span><input inputMode="numeric" value={s.lowStockAlert} onChange={(e) => set({ lowStockAlert: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></label>
          </div>
          {s.collectShipping ? (
            <div className="row2">
              <label className="f"><span>Flat shipping price</span><input inputMode="decimal" defaultValue={dollars(s.shippingFlat)} onBlur={(e) => set({ shippingFlat: cents(e.target.value) })} /></label>
              <label className="f"><span>Free shipping on orders over <em className="muted">(0 = never)</em></span><input inputMode="decimal" defaultValue={dollars(s.freeShippingOver)} onBlur={(e) => set({ freeShippingOver: cents(e.target.value) })} /></label>
            </div>
          ) : null}
          {s.collectShipping ? (
            <label className="f"><span>Ship to countries <em className="muted">(two-letter codes, comma separated)</em></span><input defaultValue={s.shipCountries.join(", ")} onBlur={(e) => set({ shipCountries: e.target.value.split(",").map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)) })} /></label>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Notifications on this device</h2></div>
        <PushToggle vapidKey={vapidKey} configured={status.push} deviceCount={deviceCount} />
        <details className="howto">
          <summary>Put the dashboard on an iPhone home screen</summary>
          <ol>
            <li>Open <strong>{siteUrl}/admin</strong> in Safari and log in.</li>
            <li>Tap the Share button, then <strong>Add to Home Screen</strong>.</li>
            <li>Open the new <strong>Shop HQ</strong> icon, come back to this page and tap <strong>Turn on notifications</strong>.</li>
          </ol>
          <p className="hint">iPhone only allows website notifications from apps added to the home screen (iOS 16.4 or newer).</p>
        </details>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Payments</h2></div>
        <div className="integrations">
          <div className="integ">
            <div className="integ-head"><strong>Stripe</strong><Dot ok={status.stripe} label={status.stripe ? (status.stripeLive ? "Live payments" : "Test mode") : undefined} /></div>
            <p className="muted">Handles every payment. Money lands in your bank from Stripe.</p>
            <div className="row wrap">
              <a className="b b-sm" href="https://dashboard.stripe.com" target="_blank" rel="noreferrer">Stripe dashboard</a>
              <a className="b b-sm b-ghost" href="https://dashboard.stripe.com/payments" target="_blank" rel="noreferrer">Payments</a>
              <a className="b b-sm b-ghost" href="https://dashboard.stripe.com/payouts" target="_blank" rel="noreferrer">Payouts</a>
              <a className="b b-sm b-ghost" href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer">API keys</a>
            </div>
          </div>
          <div className="integ">
            <div className="integ-head"><strong>Apple Pay & Google Pay</strong><Dot ok={status.stripe} label={status.stripe ? "Through Stripe" : undefined} /></div>
            <p className="muted">Turn them on once in Stripe and they appear at checkout on supported phones and browsers. No separate account needed.</p>
            <div className="row wrap">
              <a className="b b-sm" href="https://dashboard.stripe.com/settings/payment_methods" target="_blank" rel="noreferrer">Payment methods in Stripe</a>
              <a className="b b-sm b-ghost" href="https://pay.google.com/business/console" target="_blank" rel="noreferrer">Google Pay console</a>
              <a className="b b-sm b-ghost" href="https://developer.apple.com/apple-pay/" target="_blank" rel="noreferrer">Apple Pay info</a>
            </div>
          </div>
          <div className="integ">
            <div className="integ-head"><strong>Order webhook</strong><Dot ok={status.webhook} /></div>
            <p className="muted">Tells this site the moment someone pays. In Stripe, go to Developers, then Webhooks, add this address and choose the events <code>checkout.session.completed</code> and <code>charge.refunded</code>.</p>
            <Copy text={webhookUrl} />
            <div className="row wrap"><a className="b b-sm" href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer">Stripe webhooks</a></div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Hosting & storage</h2></div>
        <div className="integrations">
          <div className="integ">
            <div className="integ-head"><strong>Vercel</strong><Dot ok label="Hosting" /></div>
            <p className="muted">Where the site runs. Passwords and keys live in the project&apos;s environment variables.</p>
            <label className="f"><span>Project link or team/project</span><input value={s.vercelProject} onChange={(e) => set({ vercelProject: e.target.value })} placeholder="my-team/my-shop" /></label>
            <div className="row wrap">
              <a className="b b-sm" href={vercelUrl} target="_blank" rel="noreferrer">Open Vercel</a>
              <a className="b b-sm b-ghost" href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noreferrer">Environment variables help</a>
            </div>
          </div>
          <div className="integ">
            <div className="integ-head"><strong>GitHub</strong><Dot ok={Boolean(s.githubRepo)} label={s.githubRepo ? "Linked" : "Add your repo"} /></div>
            <p className="muted">The site&apos;s code. Vercel redeploys automatically when it changes.</p>
            <label className="f"><span>Repository</span><input value={s.githubRepo} onChange={(e) => set({ githubRepo: e.target.value })} placeholder="owner/repo" /></label>
            <div className="row wrap"><a className="b b-sm" href={repoUrl} target="_blank" rel="noreferrer">Open GitHub</a></div>
          </div>
          <div className="integ">
            <div className="integ-head"><strong>Saved data</strong><Dot ok={status.redis} label={status.redis ? "Upstash Redis" : "Temporary"} /></div>
            <p className="muted">Products, orders and settings. In Vercel, open Storage and connect Upstash Redis to this project.</p>
            <a className="b b-sm" href="https://vercel.com/marketplace/upstash" target="_blank" rel="noreferrer">Upstash on Vercel</a>
          </div>
          <div className="integ">
            <div className="integ-head"><strong>Image storage</strong><Dot ok={status.blob} label={status.blob ? "Vercel Blob" : undefined} /></div>
            <p className="muted">Logos and product photos. In Vercel, open Storage and create a Blob store for this project.</p>
            <a className="b b-sm" href="https://vercel.com/docs/storage/vercel-blob" target="_blank" rel="noreferrer">Vercel Blob help</a>
          </div>
          <div className="integ">
            <div className="integ-head"><strong>Login security</strong><Dot ok={status.password && status.authSecret} label={status.password && status.authSecret ? "Secured" : "Needs a setting"} /></div>
            <p className="muted">Your password is the <code>ADMIN_PASSWORD</code> variable in Vercel. Change it there and redeploy. <code>AUTH_SECRET</code> keeps logins safe.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>My links</h2></div>
        <p className="muted">Shortcuts to anything else you use: shipping labels, suppliers, bank, Etsy shop.</p>
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

      <section className="panel">
        <div className="panel-head"><h2>Account</h2></div>
        <LogoutButton />
      </section>
      {bar}
    </>
  );
}

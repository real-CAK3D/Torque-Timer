"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { KeyStatus } from "@/lib/keys";
import { api } from "./api";
import { Tabs } from "./Tabs";

const SOURCE: Record<KeyStatus["source"], string> = {
  vercel: "Set in Vercel",
  dashboard: "Saved here",
  unreadable: "Needs re-entering",
  missing: "Not set",
};

function KeyRow({ k, onDone }: { k: KeyStatus; onDone: (msg: string) => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(k.source === "missing" || k.source === "unreadable");

  async function run(action: "save" | "test" | "remove") {
    if (action === "remove" && !confirm(`Remove ${k.label}?`)) return;
    setBusy(action);
    setErr("");
    try {
      const r = await api<{ message: string }>("/api/admin/keys", "POST", { action, name: k.envName, value });
      if (action !== "test") setValue("");
      onDone(r.message);
      if (action === "save") setEditing(false);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy("");
  }

  return (
    <li className="key-row">
      <div className="key-head">
        <div>
          <strong>{k.label}</strong>
          {!k.custom ? <code className="key-name">{k.envName}</code> : null}
        </div>
        <span className={`dot ${k.source === "vercel" || k.source === "dashboard" ? "ok" : "no"}`}>{SOURCE[k.source]}</span>
      </div>
      <p className="muted small">
        {k.where} {k.link ? <a href={k.link} target="_blank" rel="noreferrer">Open</a> : null}
      </p>
      {k.preview ? <p className="small"><code>{k.preview}</code></p> : null}
      {k.source === "vercel" ? (
        <p className="hint">This one is set in Vercel&apos;s environment variables, which take priority. Change it there.</p>
      ) : editing ? (
        <div className="key-edit">
          <input type={k.secret ? "password" : "text"} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Paste the key here" autoComplete="off" spellCheck={false} aria-label={k.label} />
          <button className="b b-primary b-sm" onClick={() => run("save")} disabled={!value || Boolean(busy)}>{busy === "save" ? "Checking…" : "Save"}</button>
          <button className="b b-sm" onClick={() => run("test")} disabled={!value || Boolean(busy)}>{busy === "test" ? "Testing…" : "Test"}</button>
          {k.source !== "missing" ? <button className="b b-ghost b-sm" onClick={() => setEditing(false)}>Cancel</button> : null}
        </div>
      ) : (
        <div className="row wrap">
          <button className="b b-sm" onClick={() => setEditing(true)}>Replace</button>
          <button className="b b-ghost b-sm" onClick={() => run("remove")} disabled={Boolean(busy)}>Remove</button>
        </div>
      )}
      {err ? <p className="err" role="alert">{err}</p> : null}
    </li>
  );
}

export function KeysManager({ initial, strong, onVercel }: { initial: KeyStatus[]; strong: boolean; onVercel: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [custom, setCustom] = useState({ name: "", value: "" });

  const done = (m: string) => {
    setMsg(m);
    setErr("");
    router.refresh();
  };
  async function act(url: string, body: object, label: string) {
    setBusy(label);
    setErr("");
    setMsg("");
    try {
      done((await api<{ message: string }>(url, "POST", body)).message);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy("");
  }

  const groups = initial.reduce<Record<string, KeyStatus[]>>((m, k) => ((m[k.group] ??= []).push(k), m), {});
  const has = (n: string) => initial.some((k) => k.envName === n && (k.source === "vercel" || k.source === "dashboard"));

  const groupPanel = (group: string, keys: KeyStatus[]) => (
        <section className="panel">
          <div className="panel-head"><h2>{group}</h2></div>
          {group === "Stripe" ? (
            <div className="row wrap key-actions">
              <button className="b b-primary b-sm" disabled={!has("STRIPE_SECRET_KEY") || Boolean(busy)} onClick={() => act("/api/admin/stripe", { action: "webhook" }, "webhook")}>
                {busy === "webhook" ? "Connecting…" : "Connect Stripe webhook"}
              </button>
              <button className="b b-sm" disabled={!has("STRIPE_SECRET_KEY") || Boolean(busy)} onClick={() => act("/api/admin/stripe", { action: "sync" }, "sync")}>
                {busy === "sync" ? "Syncing…" : "Pull products from Stripe"}
              </button>
              {!onVercel ? <span className="hint">The webhook button only works on the live Vercel site.</span> : null}
            </div>
          ) : null}
          {group === "Phone notifications" && !has("VAPID_PRIVATE_KEY") ? (
            <div className="row wrap key-actions">
              <button className="b b-primary b-sm" disabled={Boolean(busy)} onClick={() => act("/api/admin/keys", { action: "vapid" }, "vapid")}>
                {busy === "vapid" ? "Creating…" : "Create notification keys"}
              </button>
            </div>
          ) : null}
          <ul className="keys">
            {keys.map((k) => <KeyRow key={k.envName} k={k} onDone={done} />)}
          </ul>
        </section>
  );
  const addPanel = (
      <section className="panel">
        <div className="panel-head"><h2>Add another key</h2></div>
        <p className="muted small">For any other service you start using (shipping labels, email marketing, analytics). Give it the name that service or its instructions use, like <code>SHIPPO_API_KEY</code>. Code can read it with <code>getKey(&quot;SHIPPO_API_KEY&quot;)</code> (see the API-KEYS edit point).</p>
        <form className="key-edit" onSubmit={(e) => { e.preventDefault(); act("/api/admin/keys", { action: "save", ...custom }, "custom").then(() => setCustom({ name: "", value: "" })); }}>
          <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} placeholder="NAME_OF_KEY" aria-label="Key name" spellCheck={false} />
          <input type="password" value={custom.value} onChange={(e) => setCustom({ ...custom, value: e.target.value })} placeholder="Paste the key" aria-label="Key value" autoComplete="off" />
          <button className="b b-primary b-sm" disabled={!custom.name || !custom.value || Boolean(busy)}>{busy === "custom" ? "Saving…" : "Save key"}</button>
        </form>
      </section>
  );

  return (
    <>
      <div className="page-head">
        <h1>Keys</h1>
        <Link href="/admin/setup" className="b b-ghost b-sm">Setup guide</Link>
      </div>
      <p className="muted lead">
        API keys connect the shop to other services. Paste one in and press Save; it&apos;s checked, then stored encrypted. Keys set in Vercel&apos;s environment
        variables always win over keys saved here.
      </p>
      {!strong ? (
        <p className="alert warn">For stronger protection of saved keys, add an <code>AUTH_SECRET</code> environment variable in Vercel (see Setup, step 3). Add it before saving keys here, since keys saved earlier will need re-entering.</p>
      ) : null}
      {msg ? <p className="alert" role="status">{msg}</p> : null}
      {err ? <p className="err" role="alert">{err}</p> : null}

      <Tabs
        label="Key groups"
        tabs={[
          ...Object.entries(groups).map(([group, keys]) => ({
            id: group.toLowerCase().replace(/[^a-z]+/g, "-"),
            label: group,
            badge: `${keys.filter((k) => k.source === "vercel" || k.source === "dashboard").length}/${keys.length}`,
            content: groupPanel(group, keys),
          })),
          ...(groups["Other keys"] ? [] : [{ id: "other-keys", label: "Other keys", content: null }]),
        ].map((t) => (t.id === "other-keys" ? { ...t, content: <>{t.content}{addPanel}</> } : t))}
      />
    </>
  );
}

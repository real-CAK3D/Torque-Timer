"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./api";

type Line = { area: string; label: string; from?: string; to?: string; kind: "add" | "change" | "remove" };
type Result = { summary: string; lines: Line[]; warnings: string[]; applied: boolean };
type Var = { key: string; group: string; what: string; current: string };

const EXAMPLES = [
  "Rewrite my About section so it sounds proud but humble. I served as an MP from 2006 to 2014.",
  "Add a new item: walnut pen, $35, 10 in stock, category Woodwork. Write the descriptions for me.",
  "Put everything in Leather on sale for 15% off this weekend.",
  "Switch the site to the Dress Blues theme and Showroom layout.",
  "I spent $62.40 on oak boards and $18 on shipping boxes today. Log those.",
  "Close the shop until Monday and say I'm at a craft show.",
];

export function ChatGPTHelper({ brief, vars, productVars, products, backupAt }: { brief: string; vars: Var[]; productVars: { key: string; what: string }[]; products: { slug: string; name: string; active: boolean }[]; backupAt: string | null }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [canUndo, setCanUndo] = useState(Boolean(backupAt));

  async function copy() {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([brief], { type: "text/markdown" }));
    a.download = "shop-for-chatgpt.md";
    a.click();
  }
  async function run(apply: boolean) {
    setBusy(true);
    setErr("");
    try {
      const r = await api<Result>("/api/admin/chatgpt", "POST", { text, apply });
      setResult(r);
      if (apply) {
        setCanUndo(true);
        setText("");
        router.refresh();
      }
    } catch (e) {
      setErr((e as Error).message);
      if (!apply) setResult(null);
    }
    setBusy(false);
  }
  async function undo() {
    if (!confirm("Put settings, products and expenses back the way they were before the last ChatGPT change? Anything edited since then will also be undone.")) return;
    try {
      await api("/api/admin/chatgpt", "POST", { undo: true });
      setCanUndo(false);
      setResult(null);
      router.refresh();
      alert("Undone.");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const grouped = vars.reduce<Record<string, Var[]>>((m, v) => ((m[v.group] ??= []).push(v), m), {});

  return (
    <>
      <div className="page-head">
        <h1>ChatGPT helper</h1>
        {canUndo ? <button className="b b-ghost" onClick={undo}>Undo last change</button> : null}
      </div>
      <p className="muted lead">Tell ChatGPT what you want changed in plain words. It writes the change, you paste it here, check it, and apply it. ChatGPT never needs access to the website itself.</p>

      <ol className="steps">
        <li className="panel">
          <h2>Give ChatGPT your shop</h2>
          <p>Copy this and paste it as the first message in a new ChatGPT chat. It includes your current words, prices and items, plus the rules for replying. Copy a fresh one any time you&apos;ve made changes elsewhere.</p>
          <div className="row wrap">
            <button className="b b-primary" onClick={copy}>{copied ? "Copied" : "Copy for ChatGPT"}</button>
            <button className="b" onClick={download}>Download as a file</button>
            <a className="b b-ghost" href="https://chatgpt.com" target="_blank" rel="noreferrer">Open ChatGPT</a>
          </div>
          <details className="howto">
            <summary>See what gets copied</summary>
            <pre className="brief">{brief}</pre>
          </details>
        </li>

        <li className="panel">
          <h2>Ask for what you want</h2>
          <p>Some ideas:</p>
          <ul className="examples">
            {EXAMPLES.map((e) => <li key={e}>&ldquo;{e}&rdquo;</li>)}
          </ul>
          <p className="hint">ChatGPT can&apos;t upload photos. Add those under Products or Words &amp; logos.</p>
        </li>

        <li className="panel stack">
          <h2>Paste the reply and check it</h2>
          <label className="f">
            <span>ChatGPT&apos;s reply <em className="muted">(paste the whole thing; the site finds the part it needs)</em></span>
            <textarea rows={9} value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} placeholder={'Paste here. It will include a block starting with ```json and "format": "shop-changes/v1"'} spellCheck={false} className="mono" />
          </label>
          <div className="row wrap">
            <button className="b" onClick={() => run(false)} disabled={busy || !text.trim()}>{busy && !result ? "Checking…" : "Check changes"}</button>
            {result && !result.applied && result.lines.length ? (
              <button className="b b-primary" onClick={() => run(true)} disabled={busy}>{busy ? "Applying…" : `Apply ${result.lines.length} change${result.lines.length === 1 ? "" : "s"}`}</button>
            ) : null}
          </div>
          {err ? <p className="err" role="alert">{err}</p> : null}
          {result ? (
            <div className={`preview-box ${result.applied ? "applied" : ""}`} aria-live="polite">
              {result.applied ? (
                <p><strong>Applied.</strong> Your site is updated. <a href="/" target="_blank" rel="noreferrer">View site</a></p>
              ) : result.lines.length ? (
                <p><strong>Nothing is saved yet.</strong> Look these over, then press Apply.</p>
              ) : (
                <p><strong>Nothing would change.</strong> The pasted values match what&apos;s already on the site.</p>
              )}
              {result.summary ? <p className="muted">{result.summary}</p> : null}
              {result.lines.length ? (
                <ul className="diff">
                  {result.lines.map((l, i) => (
                    <li key={i} className={`d-${l.kind}`}>
                      <span className="d-tag">{l.kind === "add" ? "New" : l.kind === "remove" ? "Delete" : "Change"}</span>
                      <span className="d-what"><strong>{l.area}</strong> · {l.label}</span>
                      {l.kind === "change" ? (
                        <span className="d-vals"><del>{l.from}</del><ins>{l.to}</ins></span>
                      ) : l.to ? (
                        <span className="d-vals"><ins>{l.to}</ins></span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {result.warnings.length ? (
                <ul className="warns">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              ) : null}
            </div>
          ) : null}
        </li>
      </ol>

      <section className="panel">
        <div className="panel-head"><h2>Site variables</h2><span className="muted small">Everything ChatGPT can change, with today&apos;s values</span></div>
        {Object.entries(grouped).map(([group, list]) => (
          <details key={group} className="vargroup">
            <summary>{group}</summary>
            <div className="tbl-scroll">
              <table className="tbl vars">
                <thead><tr><th>Name</th><th>What it does</th><th>Right now</th></tr></thead>
                <tbody>
                  {list.map((v) => (
                    <tr key={v.key}><td><code>{v.key}</code></td><td>{v.what}</td><td className="cur">{v.current || <span className="muted">(empty)</span>}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        <details className="vargroup">
          <summary>Product fields</summary>
          <div className="tbl-scroll">
            <table className="tbl vars">
              <tbody>{productVars.map((v) => <tr key={v.key}><td><code>{v.key}</code></td><td>{v.what}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
        <details className="vargroup">
          <summary>Item slugs ({products.length})</summary>
          <div className="tbl-scroll">
            <table className="tbl vars">
              <tbody>{products.map((p) => <tr key={p.slug}><td><code>{p.slug}</code></td><td>{p.name}{p.active ? "" : " (hidden)"}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </section>
    </>
  );
}

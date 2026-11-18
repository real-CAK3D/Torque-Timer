"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { HELP, type HelpBlock, type HelpTopic } from "@/lib/help";

/** Renders **bold** and `code` without injecting HTML. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith("`") ? <code key={i}>{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>
      )}
    </>
  );
}

function Block({ b }: { b: HelpBlock }) {
  if ("p" in b) return <p><Rich text={b.p} /></p>;
  if ("h" in b) return <h3>{b.h}</h3>;
  if ("tip" in b) return <p className="help-tip"><Rich text={b.tip} /></p>;
  if ("list" in b) return <ul>{b.list.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ul>;
  return <ol>{b.steps.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ol>;
}

const text = (t: HelpTopic) =>
  [t.title, t.summary, ...t.blocks.map((b) => ("p" in b ? b.p : "h" in b ? b.h : "tip" in b ? b.tip : "list" in b ? b.list.join(" ") : b.steps.join(" ")))].join(" ").toLowerCase();

export function HelpView({ guideUrl }: { guideUrl: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string>("");

  // Open the topic named in the address (#orders etc.), and follow later changes.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      setOpen(id);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const groups = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return HELP;
    return HELP.map((g) => ({ ...g, topics: g.topics.filter((t) => words.every((w) => text(t).includes(w))) })).filter((g) => g.topics.length);
  }, [q]);
  const searching = q.trim().length > 0;

  return (
    <>
      <div className="page-head">
        <h1>Help</h1>
        {guideUrl ? <a className="b b-ghost b-sm" href={guideUrl} target="_blank" rel="noreferrer">Open GUIDE.md on GitHub</a> : null}
      </div>
      <input className="search" type="search" placeholder="Search help, e.g. refund, photo, iPhone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search help" />
      {!groups.length ? <div className="panel"><p>Nothing matches “{q}”. Try a shorter word.</p></div> : null}
      {groups.map((g) => (
        <section key={g.title} className="help-group">
          <h2>{g.title}</h2>
          {g.topics.map((t) => {
            const isOpen = searching || open === t.id;
            return (
              <details key={t.id} id={t.id} className="panel help-topic" open={isOpen} onToggle={(e) => {
                const el = e.currentTarget;
                if (el.open && open !== t.id) { setOpen(t.id); history.replaceState(null, "", `#${t.id}`); }
                if (!el.open && open === t.id) setOpen("");
              }}>
                <summary>
                  <strong>{t.title}</strong>
                  <span className="muted">{t.summary}</span>
                </summary>
                <div className="help-body">{t.blocks.map((b, i) => <Block key={i} b={b} />)}</div>
              </details>
            );
          })}
        </section>
      ))}
    </>
  );
}

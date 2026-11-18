"use client";
import { useEffect, useMemo, useState } from "react";
import { HELP, type HelpTopic } from "@/lib/help";
import { Block } from "./HelpBlocks";
import { Tabs } from "./Tabs";

const text = (t: HelpTopic) =>
  [t.title, t.summary, ...t.blocks.map((b) => ("p" in b ? b.p : "h" in b ? b.h : "tip" in b ? b.tip : "list" in b ? b.list.join(" ") : b.steps.join(" ")))].join(" ").toLowerCase();

export function HelpView({ guideUrl }: { guideUrl: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string>("");

  // open the topic in the URL hash (the ? button links to /admin/help#orders etc.)
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

  const topic = (t: HelpTopic) => (
    <details key={t.id} id={t.id} className="panel help-topic" open={searching || open === t.id} onToggle={(e) => {
      const el = e.currentTarget;
      if (el.open && open !== t.id) { setOpen(t.id); history.replaceState(null, "", `${location.pathname}${location.search}#${t.id}`); }
      if (!el.open && open === t.id) setOpen("");
    }}>
      <summary>
        <strong>{t.title}</strong>
        <span className="muted">{t.summary}</span>
      </summary>
      <div className="help-body">{t.blocks.map((b, i) => <Block key={i} b={b} />)}</div>
    </details>
  );

  return (
    <>
      <div className="page-head">
        <h1>Help</h1>
        {guideUrl ? <a className="b b-ghost b-sm" href={guideUrl} target="_blank" rel="noreferrer">Open GUIDE.md on GitHub</a> : null}
      </div>
      <input className="search" type="search" placeholder="Search help, e.g. refund, photo, iPhone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search help" />
      {!groups.length ? <div className="panel"><p>Nothing matches “{q}”. Try a shorter word.</p></div> : null}
      {searching ? (
        groups.map((g) => (
          <section key={g.title} className="help-group">
            <h2>{g.title}</h2>
            {g.topics.map(topic)}
          </section>
        ))
      ) : (
        <Tabs
          label="Help sections"
          tabs={HELP.map((g) => ({ id: g.title.toLowerCase().replace(/[^a-z]+/g, "-"), label: g.title, badge: g.topics.length, content: <div className="help-group">{g.topics.map(topic)}</div> }))}
        />
      )}
    </>
  );
}

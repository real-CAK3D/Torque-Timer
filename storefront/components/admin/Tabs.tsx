"use client";
import { useEffect, useRef, useState } from "react";

export type Tab = { id: string; label: string; badge?: string | number; content: React.ReactNode };

/**
 * Splits a long page into tabs. All panels stay mounted (so unsaved form edits
 * survive switching tabs); only the active one is shown. The open tab is kept in
 * the address as ?tab=..., and a #link to something inside a tab opens that tab.
 */
export function Tabs({ tabs, label, initial }: { tabs: Tab[]; label: string; initial?: string }) {
  const [active, setActive] = useState(initial && tabs.some((t) => t.id === initial) ? initial : tabs[0]?.id);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get("tab");
    if (fromUrl && tabs.some((t) => t.id === fromUrl)) setActive(fromUrl);
    const openHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      const panel = el?.closest<HTMLElement>("[data-tab]");
      if (panel && root.current?.contains(panel)) {
        setActive(panel.dataset.tab!);
        const d = el!.matches("details") ? (el as HTMLDetailsElement) : el!.querySelector("details");
        if (d) d.open = true;
        requestAnimationFrame(() => el!.scrollIntoView({ block: "start" }));
      }
    };
    openHash();
    window.addEventListener("hashchange", openHash);
    return () => window.removeEventListener("hashchange", openHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(id: string) {
    setActive(id);
    const u = new URL(location.href);
    u.searchParams.set("tab", id);
    u.hash = "";
    history.replaceState(null, "", u);
    root.current?.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
  }

  return (
    <div ref={root} className="tabs">
      <div className="tabbar" role="tablist" aria-label={label}>
        {tabs.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={active === t.id} aria-controls={`panel-${t.id}`} onClick={() => pick(t.id)} type="button">
            {t.label}
            {t.badge !== undefined && t.badge !== "" ? <span className="tab-badge">{t.badge}</span> : null}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} data-tab={t.id} hidden={active !== t.id} className="tabpanel">
          {t.content}
        </div>
      ))}
    </div>
  );
}

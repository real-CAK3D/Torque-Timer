"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { api } from "./api";

export function useSettings(initial: SiteSettings) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);

  async function save(next = s) {
    setBusy(true);
    setMsg("");
    try {
      const res = await api<SiteSettings>("/api/admin/settings", "PUT", next);
      setS(res);
      setSaved(res);
      setMsg("Saved");
      router.refresh();
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy(false);
  }

  const set = (patch: Partial<SiteSettings>) => setS((cur) => ({ ...cur, ...patch }));

  const bar = !dirty && !msg ? null : (
    <div className={`savebar ${dirty ? "dirty" : ""}`}>
      <span className="muted" aria-live="polite">{msg || (dirty ? "You have unsaved changes" : "All changes saved")}</span>
      <button className="b b-primary" onClick={() => save()} disabled={busy || !dirty}>{busy ? "Saving…" : "Save changes"}</button>
    </div>
  );
  return { s, set, save, bar, dirty };
}

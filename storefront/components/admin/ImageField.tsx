"use client";
import { useRef, useState } from "react";
import { uploadImage } from "./api";

export function ImageField({ label, hint, value, onChange, folder, shape = "wide" }: { label: string; hint?: string; value: string; onChange: (url: string) => void; folder: string; shape?: "wide" | "square" }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true);
    setErr("");
    try {
      onChange(await uploadImage(files[0], folder));
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  }
  return (
    <div className="imgfield">
      <span className="f-label">{label}</span>
      <div className={`img-drop ${shape}`} onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" /> : <span>{busy ? "Uploading…" : "Tap to add an image"}</span>}
      </div>
      <div className="row">
        <button type="button" className="b b-sm" onClick={() => ref.current?.click()} disabled={busy}>{busy ? "Uploading…" : value ? "Replace" : "Upload"}</button>
        {value ? <button type="button" className="b b-sm b-ghost" onClick={() => onChange("")}>Remove</button> : null}
      </div>
      {hint ? <p className="hint">{hint}</p> : null}
      {err ? <p className="err">{err}</p> : null}
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

export function ImageList({ value, onChange, folder }: { value: string[]; onChange: (urls: string[]) => void; folder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setErr("");
    const list = Array.from(files).slice(0, 12 - value.length);
    setBusy(list.length);
    const urls: string[] = [];
    for (const f of list) {
      try {
        urls.push(await uploadImage(f, folder));
      } catch (e) {
        setErr((e as Error).message);
      }
      setBusy((n) => n - 1);
    }
    onChange([...value, ...urls]);
    if (ref.current) ref.current.value = "";
  }
  const move = (i: number, d: number) => {
    const next = [...value];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="imglist">
      <span className="f-label">Photos <em className="muted">(first photo is the cover)</em></span>
      <div className="imglist-grid">
        {value.map((u, i) => (
          <div key={u} className="imglist-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`Photo ${i + 1}`} />
            <div className="imglist-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left">‹</button>
              <button type="button" onClick={() => onChange(value.filter((x) => x !== u))} aria-label="Remove photo">✕</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move right">›</button>
            </div>
          </div>
        ))}
        {value.length < 12 ? (
          <button type="button" className="imglist-add" onClick={() => ref.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }}>
            {busy ? `Uploading ${busy}…` : "+ Add photos"}
          </button>
        ) : null}
      </div>
      {err ? <p className="err">{err}</p> : null}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

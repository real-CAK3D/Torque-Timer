"use client";
import { useState } from "react";

export function LoginForm({ next }: { next: string }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (res.ok) window.location.href = next;
    else {
      setErr((await res.json()).error ?? "Login failed.");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="stack">
      <label className="f">
        <span>Password</span>
        <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus required />
      </label>
      <button className="b b-primary b-block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      {err ? <p className="err" role="alert">{err}</p> : null}
    </form>
  );
}

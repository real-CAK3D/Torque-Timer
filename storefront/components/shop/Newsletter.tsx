"use client";
import { useState } from "react";

export function Newsletter({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  async function join(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) setDone(true);
    else setErr((await res.json().catch(() => ({}))).error ?? "Try again.");
  }
  return (
    <div className="newsletter">
      <strong>Get updates</strong>
      {text ? <p>{text}</p> : null}
      {done ? (
        <p role="status">You&apos;re on the list.</p>
      ) : (
        <form onSubmit={join}>
          <input name="email" type="email" required placeholder="you@example.com" aria-label="Email address" autoComplete="email" />
          <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden />
          <button className="btn btn-sm">Sign up</button>
        </form>
      )}
      {err ? <p className="error" role="alert">{err}</p> : null}
    </div>
  );
}

"use client";
import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) setState("sent");
    else {
      setErr((await res.json().catch(() => ({}))).error ?? "That didn't send. Try again.");
      setState("idle");
    }
  }
  if (state === "sent") return <p className="form-done" role="status">Message sent. You&apos;ll hear back by email.</p>;
  return (
    <form className="contact-form" onSubmit={send}>
      <label className="field"><span>Name</span><input name="name" autoComplete="name" maxLength={100} /></label>
      <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required maxLength={200} /></label>
      <label className="field full"><span>Message</span><textarea name="message" rows={4} required maxLength={5000} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden />
      <button className="btn" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send message"}</button>
      {err ? <p className="error" role="alert">{err}</p> : null}
    </form>
  );
}

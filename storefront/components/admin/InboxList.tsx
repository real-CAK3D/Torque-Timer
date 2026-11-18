"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Message } from "@/lib/types";
import { api } from "./api";

export function InboxList({ initial }: { initial: Message[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);

  async function toggle(m: Message) {
    setOpen(open === m.id ? null : m.id);
    if (!m.read) {
      setList((l) => l.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
      await api("/api/admin/messages", "POST", { action: "read", id: m.id });
      router.refresh();
    }
  }
  async function del(m: Message) {
    if (!confirm("Delete this message?")) return;
    await api("/api/admin/messages", "POST", { action: "delete", id: m.id });
    setList((l) => l.filter((x) => x.id !== m.id));
    router.refresh();
  }

  return (
    <>
      <div className="page-head"><h1>Inbox</h1></div>
      <p className="muted lead">Messages customers send from the contact form on your shop. Reply opens your email app.</p>
      {!list.length ? (
        <div className="panel"><p>No messages yet. The contact form is at the bottom of your home page.</p></div>
      ) : (
        <ul className="orders">
          {list.map((m) => (
            <li key={m.id} className={`${open === m.id ? "open" : ""} ${m.read ? "" : "unread"}`}>
              <button className="order-head inbox-head" onClick={() => toggle(m)} aria-expanded={open === m.id}>
                <strong>{m.name || m.email}</strong>
                <span className="muted trunc">{m.message}</span>
                <span className="muted">{new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </button>
              {open === m.id ? (
                <div className="order-body">
                  <p className="msg">{m.message}</p>
                  <div className="row wrap">
                    <a className="b b-primary b-sm" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}&body=${encodeURIComponent(`\n\n> ${m.message.replace(/\n/g, "\n> ")}`)}`}>Reply to {m.email}</a>
                    <button className="b b-ghost b-sm" onClick={() => del(m)}>Delete</button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

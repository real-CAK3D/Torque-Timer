"use client";
import { useState } from "react";
import { money, shortDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { api } from "./api";

const STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "paid", label: "To ship" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "refunded", label: "Refunded" },
  { id: "cancelled", label: "Cancelled" },
];

function mailto(o: Order) {
  const first = (o.name || "").split(" ")[0] || "there";
  const body = `Hi ${first},\n\nYour order #${o.number} is on its way.${o.trackingNumber ? `\n\nTracking${o.carrier ? ` (${o.carrier})` : ""}: ${o.trackingNumber}` : ""}\n\nThank you!`;
  return `mailto:${o.email}?subject=${encodeURIComponent(`Your order #${o.number} has shipped`)}&body=${encodeURIComponent(body)}`;
}

export function OrderList({ initial, openId, status, canEmail }: { initial: Order[]; openId?: string; status?: string; canEmail: boolean }) {
  const [orders, setOrders] = useState(initial);
  const [open, setOpen] = useState<string | null>(openId ?? null);
  const [filter, setFilter] = useState<string>(status ?? "all");
  const shown = orders.filter((o) => filter === "all" || o.status === filter);

  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<Record<string, string>>({});
  async function update(o: Order, patch: Partial<Order> & { emailCustomer?: boolean }) {
    const saved = await api<Order>("/api/admin/orders", "PATCH", { id: o.id, ...patch });
    setOrders((l) => l.map((x) => (x.id === saved.id ? saved : x)));
    return saved;
  }
  async function shipAndEmail(o: Order) {
    const box = document.querySelector<HTMLInputElement>(`#order-${o.id} .ship-box input`);
    const tracking = box?.value ?? o.trackingNumber ?? "";
    if (!tracking && !confirm("Send the shipped email without a tracking number?")) return;
    setBusy(o.id);
    try {
      await update(o, { status: o.status === "paid" ? "shipped" : o.status, trackingNumber: tracking, emailCustomer: true });
      setMsg((m) => ({ ...m, [o.id]: `Emailed ${o.email}.` }));
    } catch (e) {
      setMsg((m) => ({ ...m, [o.id]: "!" + (e as Error).message }));
    }
    setBusy("");
  }

  return (
    <>
      <div className="page-head">
        <h1>Orders</h1>
        <a className="b b-ghost b-sm" href="/api/admin/export?type=orders">Download spreadsheet</a>
        <div className="seg" role="group" aria-label="Filter orders">
          {[{ id: "all", label: "All" }, ...STATUSES.slice(0, 3)].map((s) => (
            <button key={s.id} className={filter === s.id ? "on" : ""} onClick={() => setFilter(s.id)}>
              {s.label} {s.id !== "all" ? `(${orders.filter((o) => o.status === s.id).length})` : ""}
            </button>
          ))}
        </div>
      </div>
      {!shown.length ? (
        <div className="panel"><p>{orders.length ? "No orders match this filter." : "No orders yet. Paid orders from Stripe show up here automatically."}</p></div>
      ) : (
        <ul className="orders">
          {shown.map((o) => (
            <li key={o.id} id={`order-${o.id}`} className={open === o.id ? "open" : ""}>
              <button className="order-head" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                <strong>#{o.number}</strong>
                <span>{o.name || o.email}</span>
                <span className="muted">{shortDate(o.createdAt)}</span>
                <span className={`pill s-${o.status}`}>{STATUSES.find((s) => s.id === o.status)?.label}</span>
                <strong>{money(o.total, o.currency)}</strong>
              </button>
              {open === o.id ? (
                <div className="order-body">
                  <div className="order-cols">
                    <div>
                      <h3>Items</h3>
                      <ul className="plain">
                        {o.items.map((i, n) => (
                          <li key={n}>{i.quantity} × {i.name}{i.option && !i.name.includes(i.option) ? ` (${i.option})` : ""} <span className="muted">{money(i.unitAmount * i.quantity, o.currency)}</span></li>
                        ))}
                        {o.discount ? <li className="muted">Discount{o.promoCode ? ` (${o.promoCode})` : ""} −{money(o.discount, o.currency)}</li> : null}
                        {o.shipping ? <li className="muted">Shipping {money(o.shipping, o.currency)}</li> : null}
                        {o.tax ? <li className="muted">Tax {money(o.tax, o.currency)}</li> : null}
                      </ul>
                      {o.paymentMethod ? <p className="muted small">Paid with {o.paymentMethod}</p> : null}
                    </div>
                    <div>
                      <h3>Ship to</h3>
                      <p className="addr">{o.name}{o.shippingAddress ? "\n" + o.shippingAddress : ""}</p>
                      <p>
                        {o.email ? <a href={`mailto:${o.email}?subject=Your order %23${o.number}`}>{o.email}</a> : null}
                        {o.phone ? <><br /><a href={`tel:${o.phone}`}>{o.phone}</a></> : null}
                      </p>
                    </div>
                  </div>
                  <div className="row wrap">
                    <label className="f inline">
                      <span>Status</span>
                      <select value={o.status} onChange={(e) => update(o, { status: e.target.value as OrderStatus })}>
                        {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </label>
                    <a className="b b-sm b-ghost" href={`https://dashboard.stripe.com/payments?query=${encodeURIComponent(o.email)}`} target="_blank" rel="noreferrer">Open in Stripe</a>
                  </div>
                  <div className="ship-box">
                    <h3>Shipping</h3>
                    <div className="row wrap">
                      <label className="f inline">
                        <span>Carrier</span>
                        <select defaultValue={o.carrier ?? ""} onChange={(e) => update(o, { carrier: e.target.value })}>
                          <option value="">Choose</option>
                          {["USPS", "UPS", "FedEx", "DHL", "Other"].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </label>
                      <label className="f inline grow">
                        <span>Tracking number</span>
                        <input defaultValue={o.trackingNumber} onBlur={(e) => e.target.value !== (o.trackingNumber ?? "") && update(o, { trackingNumber: e.target.value })} placeholder="Paste from your label" />
                      </label>
                    </div>
                    <div className="row wrap">
                      {canEmail ? (
                        <button className="b b-primary b-sm" disabled={busy === o.id || !o.email} onClick={() => shipAndEmail(o)}>
                          {busy === o.id ? "Sending…" : o.shippedEmailAt ? "Email tracking again" : "Mark shipped & email customer"}
                        </button>
                      ) : (
                        <a className="b b-primary b-sm" href={mailto(o)} onClick={() => o.status === "paid" && update(o, { status: "shipped" })}>Mark shipped & write to customer</a>
                      )}
                      {o.shippedEmailAt ? <span className="muted small">Tracking emailed {new Date(o.shippedEmailAt).toLocaleDateString()}</span> : null}
                    </div>
                    {msg[o.id] ? <p className={msg[o.id].startsWith("!") ? "err" : "small"} role="status">{msg[o.id].replace(/^!/, "")}</p> : null}
                  </div>
                  <label className="f">
                    <span>Private note</span>
                    <textarea rows={2} defaultValue={o.note} onBlur={(e) => e.target.value !== (o.note ?? "") && update(o, { note: e.target.value })} placeholder="Engraving text, anything to remember" />
                  </label>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

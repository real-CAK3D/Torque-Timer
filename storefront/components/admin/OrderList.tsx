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

export function OrderList({ initial, openId, status }: { initial: Order[]; openId?: string; status?: string }) {
  const [orders, setOrders] = useState(initial);
  const [open, setOpen] = useState<string | null>(openId ?? null);
  const [filter, setFilter] = useState<string>(status ?? "all");
  const shown = orders.filter((o) => filter === "all" || o.status === filter);

  async function update(o: Order, patch: Partial<Order>) {
    const saved = await api<Order>("/api/admin/orders", "PATCH", { id: o.id, ...patch });
    setOrders((l) => l.map((x) => (x.id === saved.id ? saved : x)));
  }

  return (
    <>
      <div className="page-head">
        <h1>Orders</h1>
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
            <li key={o.id} className={open === o.id ? "open" : ""}>
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
                        {o.shipping ? <li className="muted">Shipping {money(o.shipping, o.currency)}</li> : null}
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
                  <label className="f">
                    <span>Private note</span>
                    <textarea rows={2} defaultValue={o.note} onBlur={(e) => e.target.value !== (o.note ?? "") && update(o, { note: e.target.value })} placeholder="Tracking number, engraving text, anything to remember" />
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

import { getExpenses, getOrders, getSubscribers } from "@/lib/db";
import { getCustomers } from "@/lib/stats";

// CSV downloads: /api/admin/export?type=orders|expenses|customers|subscribers
const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // stop spreadsheets treating text as formulas
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const money = (c?: number) => ((c ?? 0) / 100).toFixed(2);

export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type");
  let rows: unknown[][] = [];
  if (type === "orders") {
    rows = [["Order", "Date", "Status", "Name", "Email", "Phone", "Items", "Subtotal", "Discount", "Promo code", "Shipping", "Tax", "Total", "Paid with", "Carrier", "Tracking", "Ship to", "Note"]];
    for (const o of await getOrders())
      rows.push([o.number, o.createdAt.slice(0, 10), o.status, o.name, o.email, o.phone, o.items.map((i) => `${i.quantity} x ${i.name}`).join("; "), money(o.subtotal), money(o.discount), o.promoCode, money(o.shipping), money(o.tax), money(o.total), o.paymentMethod, o.carrier, o.trackingNumber, (o.shippingAddress ?? "").replace(/\n/g, ", "), o.note]);
  } else if (type === "expenses") {
    rows = [["Date", "Description", "Category", "Amount"]];
    for (const e of await getExpenses()) rows.push([e.date, e.description, e.category, money(e.amount)]);
  } else if (type === "customers") {
    rows = [["Name", "Email", "Phone", "Orders", "Spent", "Last order"]];
    for (const c of await getCustomers()) rows.push([c.name, c.email, c.phone, c.orders, money(c.spent), c.last.slice(0, 10)]);
  } else if (type === "subscribers") {
    rows = [["Email", "Signed up"]];
    for (const s of await getSubscribers()) rows.push([s.email, s.createdAt.slice(0, 10)]);
  } else {
    return new Response("Unknown export", { status: 400 });
  }
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

import { NextResponse } from "next/server";
import { getOrders, getSettings, saveOrders } from "@/lib/db";
import { emailReady, sendEmail, shippedEmail } from "@/lib/email";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["paid", "shipped", "delivered", "refunded", "cancelled"];

// { id, status?, note?, trackingNumber?, carrier?, emailCustomer? }
export async function PATCH(req: Request) {
  const b = await req.json();
  const orders = await getOrders();
  const o = orders.find((x) => x.id === b.id);
  if (!o) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (STATUSES.includes(b.status)) o.status = b.status;
  if (typeof b.note === "string") o.note = b.note.slice(0, 2000);
  if (typeof b.trackingNumber === "string") o.trackingNumber = b.trackingNumber.trim().slice(0, 80) || undefined;
  if (typeof b.carrier === "string") o.carrier = b.carrier.slice(0, 20) || undefined;
  let emailed = false;
  if (b.emailCustomer) {
    const s = await getSettings();
    if (!(await emailReady(s.emailFrom))) return NextResponse.json({ error: "Email isn't set up yet (Keys > Resend, and a sender in Settings)." }, { status: 400 });
    if (!o.email) return NextResponse.json({ error: "This order has no email address." }, { status: 400 });
    const m = shippedEmail(o, s.businessName);
    await sendEmail({ from: s.emailFrom, to: o.email, subject: m.subject, text: m.text, replyTo: s.contactEmail || undefined });
    o.shippedEmailAt = new Date().toISOString();
    emailed = true;
  }
  await saveOrders(orders);
  return NextResponse.json({ ...o, emailed });
}

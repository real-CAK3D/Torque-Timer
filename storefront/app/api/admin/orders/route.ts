import { NextResponse } from "next/server";
import { getOrders, saveOrders } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["paid", "shipped", "delivered", "refunded", "cancelled"];

export async function PATCH(req: Request) {
  const b = await req.json();
  const orders = await getOrders();
  const o = orders.find((x) => x.id === b.id);
  if (!o) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (STATUSES.includes(b.status)) o.status = b.status;
  if (typeof b.note === "string") o.note = b.note.slice(0, 2000);
  await saveOrders(orders);
  return NextResponse.json(o);
}

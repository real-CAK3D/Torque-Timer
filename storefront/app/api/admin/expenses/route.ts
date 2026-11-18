import { NextResponse } from "next/server";
import { getExpenses, newId, saveExpenses } from "@/lib/db";

export async function POST(req: Request) {
  const b = await req.json();
  const list = await getExpenses();
  const e = {
    id: newId(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : new Date().toISOString().slice(0, 10),
    description: String(b.description ?? "").slice(0, 200) || "Expense",
    category: String(b.category ?? "Supplies").slice(0, 40),
    amount: Math.max(0, Math.round(Number(b.amount) || 0)),
  };
  list.unshift(e);
  list.sort((a, b) => b.date.localeCompare(a.date));
  await saveExpenses(list);
  return NextResponse.json(e);
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  await saveExpenses((await getExpenses()).filter((e) => e.id !== id));
  return NextResponse.json({ ok: true });
}

"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { money, shortDate, toCents } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { api } from "./api";


export function ExpenseManager({ initial, currency, categories }: { initial: Expense[]; currency: string; categories: string[] }) {
  const CATS = categories.length ? categories : ["Other"];
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: "", category: CATS[0], amount: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!toCents(form.amount)) return setErr("Enter an amount.");
    setBusy(true);
    setErr("");
    try {
      const x = await api<Expense>("/api/admin/expenses", "POST", { ...form, amount: toCents(form.amount) });
      setList((l) => [x, ...l].sort((a, b) => b.date.localeCompare(a.date)));
      setForm({ ...form, description: "", amount: "" });
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }
  async function del(id: string) {
    if (!confirm("Delete this expense?")) return;
    await api(`/api/admin/expenses?id=${id}`, "DELETE");
    setList((l) => l.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-head"><h2>Log an expense</h2></div>
      <form className="expense-form" onSubmit={add}>
        <label className="f"><span>Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
        <label className="f grow"><span>What for</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Walnut boards" /></label>
        <label className="f"><span>Category</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="f"><span>Amount</span><input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></label>
        <button className="b b-primary" disabled={busy}>{busy ? "Adding…" : "Add expense"}</button>
      </form>
      {err ? <p className="err">{err}</p> : null}
      {list.length ? (
        <div className="tbl-scroll">
          <table className="tbl">
            <thead><tr><th>Date</th><th>What for</th><th>Category</th><th>Amount</th><th /></tr></thead>
            <tbody>
              {list.slice(0, 100).map((x) => (
                <tr key={x.id}>
                  <td>{shortDate(x.date + "T12:00:00Z")}</td>
                  <td>{x.description}</td>
                  <td>{x.category}</td>
                  <td>{money(x.amount, currency)}</td>
                  <td><button className="b b-sm b-ghost" onClick={() => del(x.id)} aria-label={`Delete ${x.description}`}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No expenses yet. Log materials and supplies here to see real profit.</p>
      )}
    </section>
  );
}

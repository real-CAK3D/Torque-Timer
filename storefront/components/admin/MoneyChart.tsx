"use client";
import { money } from "@/lib/format";
import { BarChart } from "./BarChart";

type Day = { day: string; revenue: number; expenses: number };
const label = (day: string) => new Date(day + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function MoneyChart({ days, currency }: { days: Day[]; currency: string }) {
  return (
    <div className="two">
      <section className="panel">
        <BarChart title="Income per day" data={days.map((d) => ({ label: label(d.day), value: d.revenue }))} format={(n) => money(n, currency)} emptyText="No income recorded in this period." />
      </section>
      <section className="panel">
        <BarChart title="Expenses per day" data={days.map((d) => ({ label: label(d.day), value: d.expenses }))} format={(n) => money(n, currency)} emptyText="No expenses logged in this period." />
      </section>
    </div>
  );
}

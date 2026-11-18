"use client";
import { money } from "@/lib/format";
import { BarChart } from "./BarChart";

type Day = { day: string; revenue: number; visitors: number };

function label(day: string) {
  const d = new Date(day + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function DashboardCharts({ days, currency }: { days: Day[]; currency: string }) {
  return (
    <div className="two">
      <section className="panel">
        <BarChart title="Sales per day" data={days.map((d) => ({ label: label(d.day), value: d.revenue }))} format={(n) => money(n, currency)} emptyText="No sales in this period yet. They'll show up here as orders come in." />
      </section>
      <section className="panel">
        <BarChart title="Visitors per day" data={days.map((d) => ({ label: label(d.day), value: d.visitors }))} format={(n) => `${n} visitor${n === 1 ? "" : "s"}`} emptyText="No visitors counted yet. Share the shop link to get things moving." />
      </section>
    </div>
  );
}

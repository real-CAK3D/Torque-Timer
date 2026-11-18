import { ExpenseManager } from "@/components/admin/ExpenseManager";
import { MoneyChart } from "@/components/admin/MoneyChart";
import { RangePicker } from "@/components/admin/RangePicker";
import { Tabs } from "@/components/admin/Tabs";
import { getExpenses, getSettings } from "@/lib/db";
import { money } from "@/lib/format";
import { getStats } from "@/lib/stats";

export const metadata = { title: "Money" };

export default async function Money({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const d = Number((await searchParams).days);
  const days = [7, 30, 90, 365].includes(d) ? d : 30;
  const [st, s, expenses] = await Promise.all([getStats(days), getSettings(), getExpenses()]);
  const c = s.currency;
  const start = st.days[0].day;
  const byCat = new Map<string, number>();
  expenses.filter((e) => e.date >= start).forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
  return (
    <>
      <div className="page-head">
        <h1>Income & expenses</h1>
        <div className="row wrap">
          <a className="b b-ghost b-sm" href="/api/admin/export?type=orders">Sales spreadsheet</a>
          <a className="b b-ghost b-sm" href="/api/admin/export?type=expenses">Expenses spreadsheet</a>
        </div>
        <RangePicker base="/admin/money" current={days} />
      </div>
      <div className="tiles">
        <div className="tile"><span>Income</span><strong>{money(st.revenue, c)}</strong></div>
        <div className="tile"><span>Expenses</span><strong>{money(st.expenseTotal, c)}</strong></div>
        <div className="tile"><span>Profit</span><strong className={st.profit < 0 ? "neg" : ""}>{money(st.profit, c)}</strong></div>
        <div className="tile"><span>Margin</span><strong>{st.revenue ? `${Math.round((st.profit / st.revenue) * 100)}%` : "—"}</strong></div>
      </div>
      <Tabs
        label="Money sections"
        tabs={[
          { id: "charts", label: "Charts", content: (
            <>
              <MoneyChart days={st.days} currency={c} />
              {byCat.size ? (
                <section className="panel">
                  <div className="panel-head"><h2>Expenses by category</h2></div>
                  <table className="tbl"><tbody>{[...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => <tr key={k}><td>{k}</td><td>{money(v, c)}</td></tr>)}</tbody></table>
                </section>
              ) : null}
              <p className="muted small">Income counts paid, shipped and delivered orders (refunds are left out). Stripe fees appear in your Stripe dashboard; add them as an expense if you want them in your profit.</p>
            </>
          ) },
          { id: "expenses", label: "Expenses", badge: expenses.length, content: <ExpenseManager initial={expenses} currency={c} categories={s.expenseCategories} /> },
        ]}
      />
    </>
  );
}

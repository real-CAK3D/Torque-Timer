import Link from "next/link";
import { DashboardCharts } from "@/components/admin/ChartsClient";
import { RangePicker } from "@/components/admin/RangePicker";
import { SetupChecklist } from "@/components/admin/SetupChecklist";
import { Tabs } from "@/components/admin/Tabs";
import { getOrders, getSettings } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { getStats } from "@/lib/stats";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = [7, 30, 90, 365].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const [st, s, orders] = await Promise.all([getStats(days), getSettings(), getOrders()]);
  const c = s.currency;
  const recent = orders.slice(0, 5);
  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <RangePicker base="/admin" current={days} />
      </div>
      <SetupChecklist />
      <div className="tiles">
        <div className="tile"><span>Sales</span><strong>{money(st.revenue, c)}</strong></div>
        <div className="tile"><span>Orders</span><strong>{st.orderCount}</strong></div>
        <div className="tile"><span>Profit after expenses</span><strong className={st.profit < 0 ? "neg" : ""}>{money(st.profit, c)}</strong></div>
        <div className="tile"><span>Visitors</span><strong>{st.visitors}</strong><em>{st.visitors ? `${(st.conversion * 100).toFixed(1)}% bought something` : " "}</em></div>
      </div>
      {st.toShip || st.lowStock.length ? (
        <div className="alerts">
          {st.toShip ? <Link href="/admin/orders?status=paid" className="alert">{st.toShip} order{st.toShip === 1 ? "" : "s"} waiting to ship</Link> : null}
          {st.lowStock.map((p) => (
            <Link key={p.id} href="/admin/products" className="alert warn">{p.stock === 0 ? `${p.name} is sold out` : `${p.name}: ${p.stock} left`}</Link>
          ))}
        </div>
      ) : null}
      <Tabs
        label="Dashboard sections"
        tabs={[
          { id: "charts", label: "Charts", content: <DashboardCharts days={st.days} currency={c} /> },
          { id: "orders", label: "Recent orders", badge: st.toShip ? `${st.toShip} to ship` : undefined, content: (
            <>
        <section className="panel">
          <div className="panel-head"><h2>Recent orders</h2><Link href="/admin/orders">All orders</Link></div>
          {recent.length ? (
            <ul className="rows">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders?open=${o.id}`}>
                    <span><strong>#{o.number}</strong> {o.name || o.email}</span>
                    <span className="muted">{shortDate(o.createdAt)}</span>
                    <span className={`pill s-${o.status}`}>{o.status === "paid" ? "To ship" : o.status}</span>
                    <strong>{money(o.total, o.currency)}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No orders yet. When someone checks out, it lands here and on your phone.</p>
          )}
        </section>
            </>
          ) },
          { id: "items", label: "Popular items", content: (
            <>
        <section className="panel">
          <div className="panel-head"><h2>Best sellers</h2></div>
          {st.topSellers.length ? (
            <table className="tbl">
              <thead><tr><th>Item</th><th>Sold</th><th>Sales</th></tr></thead>
              <tbody>{st.topSellers.map((t) => <tr key={t.name}><td>{t.name}</td><td>{t.qty}</td><td>{money(t.revenue, c)}</td></tr>)}</tbody>
            </table>
          ) : <p className="muted">Nothing sold in this period yet.</p>}
          <div className="panel-head"><h2>Most viewed</h2></div>
          {st.mostViewed.length ? (
            <table className="tbl">
              <tbody>{st.mostViewed.map((t) => <tr key={t.name}><td>{t.name}</td><td>{t.views} view{t.views === 1 ? "" : "s"}</td></tr>)}</tbody>
            </table>
          ) : <p className="muted">No product views counted yet.</p>}
          {st.referrers.length ? (
            <>
              <div className="panel-head"><h2>Where visitors came from</h2></div>
              <table className="tbl"><tbody>{st.referrers.map((r) => <tr key={r.host}><td>{r.host}</td><td>{r.count}</td></tr>)}</tbody></table>
            </>
          ) : null}
        </section>
            </>
          ) },
        ]}
      />
      <p className="muted small">Average order {money(st.avgOrder, c)}, {st.views} page views, expenses {money(st.expenseTotal, c)}</p>
    </>
  );
}

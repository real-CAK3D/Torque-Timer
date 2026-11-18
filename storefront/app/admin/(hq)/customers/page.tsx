import { getSettings } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { getCustomers } from "@/lib/stats";

export const metadata = { title: "Customers" };

export default async function Customers() {
  const [list, s] = await Promise.all([getCustomers(), getSettings()]);
  const repeat = list.filter((c) => c.orders > 1).length;
  return (
    <>
      <div className="page-head"><h1>Customers</h1></div>
      <div className="tiles">
        <div className="tile"><span>Customers</span><strong>{list.length}</strong></div>
        <div className="tile"><span>Came back for more</span><strong>{repeat}</strong></div>
        <div className="tile"><span>Average spent</span><strong>{money(list.length ? Math.round(list.reduce((n, c) => n + c.spent, 0) / list.length) : 0, s.currency)}</strong></div>
      </div>
      {list.length ? (
        <section className="panel">
          <div className="tbl-scroll">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Spent</th><th>Last order</th></tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.email || c.name}>
                    <td>{c.name || "—"}</td>
                    <td>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : "—"}</td>
                    <td>{c.orders}</td>
                    <td>{money(c.spent, s.currency)}</td>
                    <td>{shortDate(c.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="panel"><p>Customers appear here after their first order.</p></div>
      )}
    </>
  );
}

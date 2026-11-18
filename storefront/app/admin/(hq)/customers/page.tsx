import { RemoveSubscriber } from "@/components/admin/RemoveSubscriber";
import { Tabs } from "@/components/admin/Tabs";
import { getSettings, getSubscribers } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { getCustomers } from "@/lib/stats";

export const metadata = { title: "Customers" };

export default async function Customers() {
  const [list, s, subs] = await Promise.all([getCustomers(), getSettings(), getSubscribers()]);
  const repeat = list.filter((c) => c.orders > 1).length;
  return (
    <>
      <div className="page-head">
        <h1>Customers</h1>
        <a className="b b-ghost b-sm" href="/api/admin/export?type=customers">Download spreadsheet</a>
      </div>
      <div className="tiles">
        <div className="tile"><span>Customers</span><strong>{list.length}</strong></div>
        <div className="tile"><span>Came back for more</span><strong>{repeat}</strong></div>
        <div className="tile"><span>Email sign-ups</span><strong>{subs.length}</strong></div>
        <div className="tile"><span>Average spent</span><strong>{money(list.length ? Math.round(list.reduce((n, c) => n + c.spent, 0) / list.length) : 0, s.currency)}</strong></div>
      </div>
      <Tabs
        label="Customer lists"
        tabs={[
          { id: "buyers", label: "Buyers", badge: list.length, content: (
            <>
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
          ) },
          { id: "signups", label: "Email sign-ups", badge: subs.length, content: (
            <>
      <section className="panel">
        <div className="panel-head">
          <h2>Email sign-ups</h2>
          {subs.length ? <a href="/api/admin/export?type=subscribers">Download list</a> : null}
        </div>
        {subs.length ? (
          <>
            <p className="muted small">People who asked for updates from the footer of your shop. Download the list to import into an email tool like Mailchimp or Kit, or BCC them from your own email.</p>
            <div className="tbl-scroll">
              <table className="tbl">
                <tbody>
                  {subs.map((x) => (
                    <tr key={x.email}><td><a href={`mailto:${x.email}`}>{x.email}</a></td><td>{shortDate(x.createdAt)}</td><td><RemoveSubscriber email={x.email} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="muted">No sign-ups yet. The sign-up box is in your shop&apos;s footer (turn it on or off in Settings).</p>
        )}
      </section>
            </>
          ) },
        ]}
      />
    </>
  );
}

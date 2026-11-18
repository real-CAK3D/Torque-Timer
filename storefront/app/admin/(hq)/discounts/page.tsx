import Link from "next/link";
import { getOrders, getSettings } from "@/lib/db";
import { money, shortDate } from "@/lib/format";
import { getKey } from "@/lib/keys";
import { listDiscounts } from "@/lib/stripe-catalog";

export const metadata = { title: "Discounts" };

export default async function Discounts() {
  const [s, orders, key] = await Promise.all([getSettings(), getOrders(), getKey("STRIPE_SECRET_KEY")]);
  let data: Awaited<ReturnType<typeof listDiscounts>> = { codes: [], coupons: [] };
  let err = "";
  if (key) {
    try {
      data = await listDiscounts();
    } catch (e) {
      err = (e as Error).message;
    }
  }
  const saved = orders.filter((o) => o.discount).reduce((n, o) => n + (o.discount ?? 0), 0);
  const test = key?.includes("_test_") ? "test/" : "";
  return (
    <>
      <div className="page-head">
        <h1>Discounts</h1>
        <a className="b b-primary" href={`https://dashboard.stripe.com/${test}coupons/create`} target="_blank" rel="noreferrer">Make a coupon in Stripe</a>
      </div>
      <p className="muted lead">
        Coupons and promo codes are made in Stripe. Customers type the code on the checkout page.
        {s.allowPromoCodes ? "" : " The promo code box is turned off; turn it on in Settings."}
      </p>
      {!key ? <div className="panel"><p>Connect Stripe first. <Link href="/admin/keys">Open Keys</Link></p></div> : null}
      {err ? <p className="err">{err}</p> : null}
      {key ? (
        <>
          <div className="tiles">
            <div className="tile"><span>Active codes</span><strong>{data.codes.filter((c) => c.active).length}</strong></div>
            <div className="tile"><span>Orders with a code</span><strong>{orders.filter((o) => o.discount).length}</strong></div>
            <div className="tile"><span>Total discounted</span><strong>{money(saved, s.currency)}</strong></div>
          </div>
          <section className="panel">
            <div className="panel-head"><h2>Promo codes</h2><a href={`https://dashboard.stripe.com/${test}coupons`} target="_blank" rel="noreferrer">Manage in Stripe</a></div>
            {data.codes.length ? (
              <div className="tbl-scroll">
                <table className="tbl">
                  <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Expires</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.codes.map((c) => (
                      <tr key={c.id}>
                        <td><code>{c.code}</code></td>
                        <td>{c.label}</td>
                        <td>{c.uses}{c.maxUses ? ` of ${c.maxUses}` : ""}</td>
                        <td>{c.expires ? shortDate(c.expires) : "Never"}</td>
                        <td>{c.active ? "Active" : "Off"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No codes yet. In Stripe, make a coupon and add a customer-facing code to it, like VETERAN10.</p>
            )}
          </section>
          {data.coupons.length ? (
            <section className="panel">
              <div className="panel-head"><h2>Coupons</h2></div>
              <p className="muted small">A coupon is the discount itself; give it a promo code in Stripe so customers can use it.</p>
              <table className="tbl"><tbody>{data.coupons.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.label}</td><td>{c.valid ? "Valid" : "Expired"}</td></tr>)}</tbody></table>
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
}

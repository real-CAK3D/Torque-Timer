import Link from "next/link";
import { ClearCart } from "@/components/shop/ClearCart";
import { recordOrderFromSession } from "@/lib/orders";
import { getOrders, getSettings } from "@/lib/db";
import { money } from "@/lib/format";

export const metadata = { title: "Thank you" };

export default async function Success({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const s = await getSettings();
  let order = null;
  if (session_id && /^cs_[A-Za-z0-9_]+$/.test(session_id)) {
    // Records the order now in case the webhook hasn't arrived yet (safe to repeat).
    await recordOrderFromSession(session_id).catch((e) => console.error(e));
    order = (await getOrders()).find((o) => o.id === session_id) ?? null;
  }
  return (
    <section className="section success">
      <ClearCart />
      <h1>Thank you{order?.name ? `, ${order.name.split(" ")[0]}` : ""}.</h1>
      {order ? (
        <>
          <p className="lede">
            Order #{order.number} is confirmed. A receipt is on its way to {order.email}.
          </p>
          <ul className="receipt">
            {order.items.map((i, n) => (
              <li key={n}>
                <span>{i.quantity} × {i.name}</span>
                <span>{money(i.unitAmount * i.quantity, order!.currency)}</span>
              </li>
            ))}
            {order.discount ? <li><span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span><span>−{money(order.discount, order.currency)}</span></li> : null}
            {order.shipping ? <li><span>Shipping</span><span>{money(order.shipping, order.currency)}</span></li> : null}
            {order.tax ? <li><span>Tax</span><span>{money(order.tax, order.currency)}</span></li> : null}
            <li className="total"><span>Total paid</span><span>{money(order.total, order.currency)}</span></li>
          </ul>
        </>
      ) : (
        <p className="lede">Your order is confirmed. A receipt is on its way to your inbox.</p>
      )}
      <p>{s.shippingPolicy}</p>
      <Link href="/" className="btn">Back to the shop</Link>
    </section>
  );
}

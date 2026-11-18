import { CartView } from "@/components/shop/CartView";
import { getSettings } from "@/lib/db";

export const metadata = { title: "Your cart" };

export default async function CartPage() {
  const s = await getSettings();
  return (
    <section className="section cart">
      <h1>Your cart</h1>
      <CartView currency={s.currency} shippingFlat={s.collectShipping ? s.shippingFlat : 0} freeOver={s.freeShippingOver} storeOpen={s.storeOpen} closedMessage={s.closedMessage} promoCodes={s.allowPromoCodes} tax={s.stripeTax} />
    </section>
  );
}

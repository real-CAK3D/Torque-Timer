import { ProductManager } from "@/components/admin/ProductManager";
import { getAnalytics, getProducts, getSettings } from "@/lib/db";
import { getKey } from "@/lib/keys";

export const metadata = { title: "Products" };

export default async function Products() {
  const [products, s, a, key] = await Promise.all([getProducts(), getSettings(), getAnalytics(), getKey("STRIPE_SECRET_KEY")]);
  return <ProductManager initial={products} currency={s.currency} views={a.productViews} lowAt={s.lowStockAlert} stripeOn={Boolean(key)} stripeTest={Boolean(key?.includes("_test_"))} />;
}

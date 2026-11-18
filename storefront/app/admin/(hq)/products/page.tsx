import { ProductManager } from "@/components/admin/ProductManager";
import { getAnalytics, getProducts, getSettings } from "@/lib/db";

export const metadata = { title: "Products" };

export default async function Products() {
  const [products, s, a] = await Promise.all([getProducts(), getSettings(), getAnalytics()]);
  return <ProductManager initial={products} currency={s.currency} views={a.productViews} lowAt={s.lowStockAlert} />;
}

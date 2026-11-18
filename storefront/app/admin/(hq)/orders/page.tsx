import { OrderList } from "@/components/admin/OrderList";
import { getOrders } from "@/lib/db";

export const metadata = { title: "Orders" };

export default async function Orders({ searchParams }: { searchParams: Promise<{ open?: string; status?: string }> }) {
  const [sp, orders] = await Promise.all([searchParams, getOrders()]);
  return <OrderList initial={orders} openId={sp.open} status={sp.status} />;
}

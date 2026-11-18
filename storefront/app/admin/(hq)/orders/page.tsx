import { OrderList } from "@/components/admin/OrderList";
import { getOrders, getSettings } from "@/lib/db";
import { emailReady } from "@/lib/email";

export const metadata = { title: "Orders" };

export default async function Orders({ searchParams }: { searchParams: Promise<{ open?: string; status?: string }> }) {
  const [sp, orders, s] = await Promise.all([searchParams, getOrders(), getSettings()]);
  return <OrderList initial={orders} openId={sp.open} status={sp.status} canEmail={await emailReady(s.emailFrom)} />;
}

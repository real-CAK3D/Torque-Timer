import "server-only";
import { dayKey, getAnalytics, getExpenses, getOrders, getProducts } from "./db";

export type DayPoint = { day: string; revenue: number; orders: number; views: number; visitors: number; expenses: number };

const COUNTED = new Set(["paid", "shipped", "delivered"]);

export async function getStats(rangeDays: number) {
  const [orders, expenses, analytics, products] = await Promise.all([getOrders(), getExpenses(), getAnalytics(), getProducts()]);
  const days: DayPoint[] = [];
  const today = new Date();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const k = dayKey(d);
    days.push({ day: k, revenue: 0, orders: 0, views: analytics.views[k] ?? 0, visitors: analytics.visitors[k] ?? 0, expenses: 0 });
  }
  const idx = new Map(days.map((d, i) => [d.day, i]));
  const start = days[0].day;

  const inRange = orders.filter((o) => o.createdAt.slice(0, 10) >= start);
  for (const o of inRange) {
    const i = idx.get(o.createdAt.slice(0, 10));
    if (i === undefined || !COUNTED.has(o.status)) continue;
    days[i].revenue += o.total;
    days[i].orders += 1;
  }
  for (const e of expenses) {
    const i = idx.get(e.date);
    if (i !== undefined) days[i].expenses += e.amount;
  }

  const revenue = days.reduce((n, d) => n + d.revenue, 0);
  const orderCount = days.reduce((n, d) => n + d.orders, 0);
  const expenseTotal = days.reduce((n, d) => n + d.expenses, 0);
  const visitors = days.reduce((n, d) => n + d.visitors, 0);
  const views = days.reduce((n, d) => n + d.views, 0);

  // top sellers in range
  const sold = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of inRange) {
    if (!COUNTED.has(o.status)) continue;
    for (const it of o.items) {
      const cur = sold.get(it.productId || it.name) ?? { name: it.name, qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += it.quantity * it.unitAmount;
      sold.set(it.productId || it.name, cur);
    }
  }
  const topSellers = [...sold.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const mostViewed = products
    .map((p) => ({ name: p.name, views: analytics.productViews[p.id] ?? 0 }))
    .filter((p) => p.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  const referrers = Object.entries(analytics.referrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([host, count]) => ({ host, count }));

  return {
    days,
    revenue,
    orderCount,
    avgOrder: orderCount ? Math.round(revenue / orderCount) : 0,
    expenseTotal,
    profit: revenue - expenseTotal,
    visitors,
    views,
    conversion: visitors ? orderCount / visitors : 0,
    topSellers,
    mostViewed,
    referrers,
    toShip: orders.filter((o) => o.status === "paid").length,
    lowStock: products.filter((p) => p.active && p.stock !== null && p.stock <= 2),
  };
}

export async function getCustomers() {
  const orders = await getOrders();
  const map = new Map<string, { email: string; name: string; orders: number; spent: number; last: string; phone?: string }>();
  for (const o of orders) {
    const key = (o.email || o.name).toLowerCase();
    if (!key) continue;
    const c = map.get(key) ?? { email: o.email, name: o.name, orders: 0, spent: 0, last: o.createdAt, phone: o.phone };
    c.orders += 1;
    if (COUNTED.has(o.status)) c.spent += o.total;
    if (o.createdAt > c.last) c.last = o.createdAt;
    if (!c.name && o.name) c.name = o.name;
    map.set(key, c);
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent);
}

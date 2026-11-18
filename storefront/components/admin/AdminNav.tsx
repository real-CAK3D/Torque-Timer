"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10", tab: true },
  { href: "/admin/orders", label: "Orders", icon: "M4 4h16v4H4zM5 8v12h14V8M9 12h6", tab: true },
  { href: "/admin/products", label: "Products", icon: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5", tab: true },
  { href: "/admin/money", label: "Money", icon: "M3 6h18v12H3zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M6 9v.01M18 15v.01", tab: true },
  { href: "/admin/customers", label: "Customers", icon: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8" },
  { href: "/admin/content", label: "Words & logos", icon: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4" },
  { href: "/admin/appearance", label: "Look & layout", icon: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4-4-7.5-9-7.5M7.5 12v.01M10 7.5v.01M15 7.5v.01" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function AdminNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const moreActive = ITEMS.filter((i) => !i.tab).some((i) => active(i.href)) || path.startsWith("/admin/more");
  return (
    <>
      <nav className="hq-side" aria-label="Dashboard">
        {ITEMS.map((i) => (
          <Link key={i.href} href={i.href} className={active(i.href) ? "on" : ""} aria-current={active(i.href) ? "page" : undefined}>
            <Icon d={i.icon} />
            {i.label}
          </Link>
        ))}
      </nav>
      <nav className="hq-tabs" aria-label="Dashboard tabs">
        {ITEMS.filter((i) => i.tab).map((i) => (
          <Link key={i.href} href={i.href} className={active(i.href) ? "on" : ""}>
            <Icon d={i.icon} />
            <span>{i.label}</span>
          </Link>
        ))}
        <Link href="/admin/more" className={moreActive ? "on" : ""}>
          <Icon d="M5 12h.01M12 12h.01M19 12h.01" />
          <span>More</span>
        </Link>
      </nav>
    </>
  );
}

export const MORE_ITEMS = ITEMS.filter((i) => !i.tab);

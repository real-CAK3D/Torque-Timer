import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { HelpButton } from "@/components/admin/HelpButton";
import { RegisterSW } from "@/components/admin/RegisterSW";
import { getNotifications, getSettings } from "@/lib/db";

export default async function HQLayout({ children }: { children: React.ReactNode }) {
  const [s, notes] = await Promise.all([getSettings(), getNotifications()]);
  const unread = notes.filter((n) => !n.read).length;
  return (
    <div className="hq-shell">
      <RegisterSW />
      <header className="hq-top">
        <Link href="/admin" className="hq-brand">
          <span className="hq-star" aria-hidden>★</span>
          <span>{s.businessName}</span>
        </Link>
        <div className="hq-top-actions">
          <a href="/" target="_blank" rel="noreferrer" className="b b-ghost b-sm">View site</a>
          <HelpButton />
          <Link href="/admin/notifications" className="bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
              <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
            </svg>
            {unread ? <b>{unread > 9 ? "9+" : unread}</b> : null}
          </Link>
        </div>
      </header>
      <AdminNav />
      <main className="hq-main">{children}</main>
    </div>
  );
}

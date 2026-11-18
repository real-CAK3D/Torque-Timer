import Link from "next/link";
import { MarkRead } from "@/components/admin/MarkRead";
import { getNotifications } from "@/lib/db";

export const metadata = { title: "Notifications" };

export default async function Notes() {
  const list = await getNotifications();
  return (
    <>
      <div className="page-head"><h1>Notifications</h1></div>
      <MarkRead hasUnread={list.some((n) => !n.read)} />
      {list.length ? (
        <ul className="notes">
          {list.map((n) => (
            <li key={n.id} className={n.read ? "" : "unread"}>
              <Link href={n.url || "/admin"}>
                <strong>{n.title}</strong>
                <span>{n.body}</span>
                <time className="muted small">{new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel"><p>Nothing yet. New orders and low-stock warnings show up here.</p></div>
      )}
    </>
  );
}

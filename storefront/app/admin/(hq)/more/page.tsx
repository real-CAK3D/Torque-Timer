import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata = { title: "More" };

const LINKS = [
  { href: "/admin/customers", label: "Customers", note: "Who's buying and how much" },
  { href: "/admin/content", label: "Words & logos", note: "Business name, about, logos, photos" },
  { href: "/admin/appearance", label: "Look & layout", note: "Themes and page styles" },
  { href: "/admin/chatgpt", label: "ChatGPT helper", note: "Describe a change, paste ChatGPT's answer, done" },
  { href: "/admin/notifications", label: "Notifications", note: "Orders and alerts" },
  { href: "/admin/settings", label: "Settings", note: "Payments, shipping, linked accounts" },
];

export default function More() {
  return (
    <>
      <h1>More</h1>
      <ul className="menu-list">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>
              <strong>{l.label}</strong>
              <span className="muted">{l.note}</span>
            </Link>
          </li>
        ))}
      </ul>
      <LogoutButton />
    </>
  );
}

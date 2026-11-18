import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata = { title: "More" };

const GROUPS = [
  {
    title: "Selling",
    links: [{ href: "/admin/discounts", label: "Discounts", note: "Coupons and promo codes from Stripe" }],
  },
  {
    title: "Customers",
    links: [
      { href: "/admin/customers", label: "Customers", note: "Who's buying, email sign-ups, downloads" },
      { href: "/admin/inbox", label: "Inbox", note: "Messages from the contact form" },
      { href: "/admin/notifications", label: "Notifications", note: "Orders and alerts" },
    ],
  },
  {
    title: "Your site",
    links: [
      { href: "/admin/content", label: "Words & logos", note: "Business name, about, logos, photos" },
      { href: "/admin/appearance", label: "Look & layout", note: "Themes and page styles" },
    ],
  },
  {
    title: "Admin",
    links: [
      { href: "/admin/setup", label: "Setup", note: "Step by step: GitHub, Vercel, Supabase, Stripe" },
      { href: "/admin/keys", label: "Keys", note: "API keys for Stripe and other services" },
      { href: "/admin/settings", label: "Settings", note: "Shipping, checkout, password, your accounts" },
      { href: "/admin/help", label: "Help", note: "How every part of the site works" },
    ],
  },
];

export default function More() {
  return (
    <>
      <h1>More</h1>
      {GROUPS.map((g) => (
        <section key={g.title} className="more-group">
          <h2>{g.title}</h2>
          <ul className="menu-list">
            {g.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>
                  <strong>{l.label}</strong>
                  <span className="muted">{l.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <LogoutButton />
    </>
  );
}

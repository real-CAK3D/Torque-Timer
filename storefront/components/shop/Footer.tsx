import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { Logo } from "./Logo";
import { Newsletter } from "./Newsletter";
import { Social } from "./Social";

export function Footer({ s }: { s: SiteSettings }) {
  const links = [
    { href: "/policies/shipping", label: "Shipping", show: Boolean(s.shippingPolicy) },
    { href: "/policies/returns", label: "Returns", show: Boolean(s.returnPolicy) },
    { href: "/policies/privacy", label: "Privacy", show: Boolean(s.privacyPolicy) },
    { href: "/policies/terms", label: "Terms", show: Boolean(s.termsOfService) },
    { href: "/contact", label: "Contact", show: true },
  ].filter((l) => l.show);
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo s={s} size={40} />
          <div>
            <strong>{s.businessName}</strong>
            {s.showVeteranBadge && s.serviceLine ? <p className="muted">{s.serviceLine}</p> : null}
          </div>
        </div>
        <nav className="footer-links" aria-label="Policies">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>
        {s.showNewsletter ? <Newsletter text={s.newsletterText} /> : null}
        <Social links={s.social} />
      </div>
      {/*
          EDIT-POINT: FOOTER
          Small print at the very bottom of every shop page. The policy pages
          themselves are written in site-variables.ts (policies).
          */}
      <p className="fine">
        © {new Date().getFullYear()} {s.businessName}. Secure checkout by Stripe. Apple Pay and Google Pay accepted.
      </p>
    </footer>
  );
}

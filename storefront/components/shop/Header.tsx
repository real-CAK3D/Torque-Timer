import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { CartButton } from "./CartButton";
import { Logo } from "./Logo";

export function Header({ s }: { s: SiteSettings }) {
  return (
    <>
      {s.announcement ? <div className="announce">{s.announcement}</div> : null}
      <header className="band">
        <div className="band-inner">
          <Link href="/" className="brand">
            <Logo s={s} />
            <span className="brand-name">{s.businessName}</span>
          </Link>
          {/* ========================================================================
              EDIT-POINT: NAV-LINKS
              The menu links in the top bar of the shop. Add a <Link href="...">Name</Link>.
              ======================================================================== */}
          <nav className="nav" aria-label="Main">
            <Link href="/#shop">Shop</Link>
            <Link href="/#about">About</Link>
            <Link href="/#contact">Contact</Link>
            <CartButton />
          </nav>
        </div>
      </header>
      {!s.storeOpen ? <div className="closed-note">{s.closedMessage}</div> : null}
    </>
  );
}

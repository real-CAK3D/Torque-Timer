import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { NavLinks } from "./NavLinks";
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
          <NavLinks />
        </div>
      </header>
      {!s.storeOpen ? <div className="closed-note">{s.closedMessage}</div> : null}
    </>
  );
}

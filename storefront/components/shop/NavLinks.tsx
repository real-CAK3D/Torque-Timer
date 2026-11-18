"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CartButton } from "./CartButton";

/*
 * EDIT-POINT: NAV-LINKS
 * The menu links in the top bar of the shop. Add { href: "/somewhere", label: "Name" }.
 * On phones they fold into the Menu button.
 */
const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function NavLinks() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <nav className={`nav ${open ? "open" : ""}`} aria-label="Main">
      <button type="button" className="menu-btn" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(!open)}>
        Menu
      </button>
      <div id="nav-links" className="nav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={path === l.href || path.startsWith(l.href + "/") ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </div>
      <CartButton />
    </nav>
  );
}

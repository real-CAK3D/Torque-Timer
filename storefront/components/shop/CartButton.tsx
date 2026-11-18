"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="cart-btn" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
      </svg>
      <span>Cart</span>
      {count > 0 ? <b className="cart-count">{count}</b> : null}
    </Link>
  );
}

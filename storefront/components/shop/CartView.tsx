"use client";
import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/format";
import { useCart } from "./CartProvider";

export function CartView(props: { currency: string; shippingFlat: number; freeOver: number; storeOpen: boolean; closedMessage: string; promoCodes: boolean; tax: boolean }) {
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!cart.lines.length) {
    return (
      <div className="empty">
        <p>Your cart is empty.</p>
        <Link href="/shop" className="btn">Browse the shop</Link>
      </div>
    );
  }

  const free = props.freeOver > 0 && cart.subtotal >= props.freeOver;
  const shipping = free ? 0 : props.shippingFlat;

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: cart.lines }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || "Checkout couldn't start.");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="cart-wrap">
      <ul className="cart-lines">
        {cart.lines.map((l) => {
          const p = cart.products.find((x) => x.id === l.productId)!;
          return (
            <li key={l.productId + (l.option ?? "")} className="cart-line">
              <Link href={`/product/${p.slug}`} className="cart-thumb">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" />
                ) : (
                  <span />
                )}
              </Link>
              <div className="cart-name">
                <Link href={`/product/${p.slug}`}>{p.name}</Link>
                {l.option ? <span className="muted">{l.option}</span> : null}
              </div>
              <div className="stepper" role="group" aria-label={`Quantity of ${p.name}`}>
                <button onClick={() => cart.setQty(l.productId, l.option, l.quantity - 1)} aria-label="One fewer">−</button>
                <span>{l.quantity}</span>
                <button onClick={() => cart.setQty(l.productId, l.option, l.quantity + 1)} aria-label="One more" disabled={p.stock !== null && l.quantity >= p.stock}>+</button>
              </div>
              <span className="cart-amt">{money(p.price * l.quantity, props.currency)}</span>
            </li>
          );
        })}
      </ul>
      <aside className="cart-sum">
        <dl>
          <div><dt>Subtotal</dt><dd>{money(cart.subtotal, props.currency)}</dd></div>
          {props.shippingFlat > 0 ? (
            <div><dt>Shipping</dt><dd>{free ? "Free" : money(shipping, props.currency)}</dd></div>
          ) : null}
          <div className="total"><dt>Total</dt><dd>{money(cart.subtotal + shipping, props.currency)}</dd></div>
        </dl>
        {props.freeOver > 0 && !free && props.shippingFlat > 0 ? (
          <p className="muted small">Add {money(props.freeOver - cart.subtotal, props.currency)} more for free shipping.</p>
        ) : null}
        {props.storeOpen ? (
          <button className="btn btn-lg btn-block" onClick={checkout} disabled={busy}>
            {busy ? "Opening secure checkout…" : "Check out"}
          </button>
        ) : (
          <p>{props.closedMessage}</p>
        )}
        <p className="pay-note">
          Pay with card, Apple Pay or Google Pay on Stripe&apos;s secure page.
          {props.promoCodes ? " Have a promo code? Enter it there." : ""}
          {props.tax ? " Sales tax is added at checkout." : ""}
        </p>
        {error ? <p className="error" role="alert">{error}</p> : null}
      </aside>
    </div>
  );
}

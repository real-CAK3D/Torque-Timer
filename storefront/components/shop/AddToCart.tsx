"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";

export function AddToCart({
  productId,
  option,
  soldOut,
  storeOpen,
  compact = false,
}: {
  productId: string;
  option?: { label: string; values: string[] } | null;
  soldOut: boolean;
  storeOpen: boolean;
  compact?: boolean;
}) {
  const cart = useCart();
  const [choice, setChoice] = useState(option?.values[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!storeOpen) return <p className="muted">Ordering is paused right now.</p>;
  if (soldOut) return <button className="btn" disabled>Sold out</button>;

  function add() {
    cart.add({ productId, quantity: qty, option: choice || undefined });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  if (compact) {
    return (
      <button className="btn btn-sm" onClick={add} aria-live="polite">
        {added ? "Added" : "Add to cart"}
      </button>
    );
  }

  return (
    <div className="buy">
      {option ? (
        <label className="field">
          <span>{option.label}</span>
          <select value={choice} onChange={(e) => setChoice(e.target.value)}>
            {option.values.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="field qty">
        <span>Quantity</span>
        <input type="number" min={1} max={99} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
      </label>
      <button className="btn btn-lg" onClick={add}>
        Add to cart
      </button>
      <p className="added" aria-live="polite">
        {added ? (
          <>
            Added to your cart. <Link href="/cart">Check out now</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}

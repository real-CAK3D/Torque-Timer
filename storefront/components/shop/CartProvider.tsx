"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { productId: string; quantity: number; option?: string };
export type CartProduct = { id: string; name: string; price: number; image?: string; slug: string; stock: number | null };

type Ctx = {
  lines: CartLine[];
  products: CartProduct[];
  count: number;
  subtotal: number;
  add: (l: CartLine) => void;
  setQty: (productId: string, option: string | undefined, qty: number) => void;
  clear: () => void;
  lastAdded: number;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "cart:v1";

export function CartProvider({ products, children }: { products: CartProduct[]; children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [lastAdded, setLastAdded] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines((JSON.parse(raw) as CartLine[]).filter((l) => products.some((p) => p.id === l.productId)));
    } catch {}
  }, [products]);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const value = useMemo<Ctx>(() => {
    const same = (a: CartLine, id: string, opt?: string) => a.productId === id && (a.option ?? "") === (opt ?? "");
    return {
      lines,
      products,
      lastAdded,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + (products.find((p) => p.id === l.productId)?.price ?? 0) * l.quantity, 0),
      add(l) {
        const existing = lines.find((x) => same(x, l.productId, l.option));
        persist(
          existing
            ? lines.map((x) => (x === existing ? { ...x, quantity: Math.min(99, x.quantity + l.quantity) } : x))
            : [...lines, l]
        );
        setLastAdded(Date.now());
      },
      setQty(id, opt, qty) {
        persist(qty <= 0 ? lines.filter((x) => !same(x, id, opt)) : lines.map((x) => (same(x, id, opt) ? { ...x, quantity: Math.min(99, qty) } : x)));
      },
      clear() {
        persist([]);
      },
    };
  }, [lines, products, lastAdded, persist]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

"use client";
import { useEffect } from "react";
import { useCart } from "./CartProvider";

export function ClearCart() {
  const { clear, count } = useCart();
  useEffect(() => {
    if (count) clear();
  }, [count, clear]);
  return null;
}

"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function Tracker({ productId }: { productId?: string }) {
  const path = usePathname();
  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, productId, referrer: document.referrer }),
        keepalive: true,
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [path, productId]);
  return null;
}

"use client";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";

export function Gallery({ p }: { p: Product }) {
  const [i, setI] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main">
        <ProductImage p={p} index={i} />
      </div>
      {p.images.length > 1 ? (
        <div className="gallery-thumbs">
          {p.images.map((src, n) => (
            <button key={src} onClick={() => setI(n)} aria-label={`Photo ${n + 1}`} aria-pressed={n === i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

import type { Product } from "@/lib/types";

export function ProductImage({ p, index = 0, className = "" }: { p: Product; index?: number; className?: string }) {
  const src = p.images[index];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={p.name} className={`pimg ${className}`} loading="lazy" />;
  }
  return (
    <div className={`pimg pimg-empty ${className}`} aria-label={`${p.name} (photo coming soon)`}>
      <span>{p.name}</span>
    </div>
  );
}

import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/db";
import { siteUrl } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getActiveProducts().catch(() => []);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...["shipping", "returns", "privacy", "terms"].map((x) => ({ url: `${base}/policies/${x}`, priority: 0.2 })),
  ];
}

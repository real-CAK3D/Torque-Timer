import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/db";
import { paragraphs } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";

const PAGES: Record<string, { title: string; field: keyof SiteSettings }> = {
  shipping: { title: "Shipping", field: "shippingPolicy" },
  returns: { title: "Returns", field: "returnPolicy" },
  privacy: { title: "Privacy", field: "privacyPolicy" },
  terms: { title: "Terms of sale", field: "termsOfService" },
};

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = PAGES[(await params).slug];
  return p ? { title: p.title } : {};
}

export default async function Policy({ params }: Params) {
  const page = PAGES[(await params).slug];
  if (!page) notFound();
  const s = await getSettings();
  const text = String(s[page.field] ?? "")
    .replaceAll("{business}", s.businessName)
    .replaceAll("{email}", s.contactEmail || "the email on our contact section");
  return (
    <article className="section policy prose">
      <h1>{page.title}</h1>
      {text ? paragraphs(text).map((p, i) => <p key={i}>{p}</p>) : <p className="muted">Coming soon.</p>}
    </article>
  );
}

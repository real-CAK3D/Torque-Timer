import { NextResponse } from "next/server";
import { getProducts, newId, saveProducts, slugify } from "@/lib/db";
import type { Product } from "@/lib/types";

function clean(input: Partial<Product>, existing?: Product): Product {
  const now = new Date().toISOString();
  const optionValues = (input.option?.values ?? []).map((v) => String(v).trim()).filter(Boolean);
  return {
    id: existing?.id ?? newId(),
    slug: existing?.slug ?? "",
    name: String(input.name ?? "").trim().slice(0, 120) || "Untitled item",
    price: Math.max(0, Math.round(Number(input.price) || 0)),
    compareAtPrice: input.compareAtPrice ? Math.max(0, Math.round(Number(input.compareAtPrice))) : null,
    summary: String(input.summary ?? "").slice(0, 300),
    description: String(input.description ?? "").slice(0, 8000),
    category: String(input.category ?? "").trim().slice(0, 60),
    images: (input.images ?? []).filter((u) => typeof u === "string").slice(0, 12),
    stock: input.stock === null || input.stock === undefined || (input.stock as unknown) === "" ? null : Math.max(0, Math.floor(Number(input.stock))),
    madeToOrder: Boolean(input.madeToOrder),
    featured: Boolean(input.featured),
    active: input.active === undefined ? true : Boolean(input.active),
    option: input.option?.label && optionValues.length ? { label: String(input.option.label).slice(0, 40), values: optionValues.slice(0, 20) } : null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function uniqueSlug(name: string, list: Product[], selfId: string) {
  const base = slugify(name);
  let slug = base;
  let i = 2;
  while (list.some((p) => p.slug === slug && p.id !== selfId)) slug = `${base}-${i++}`;
  return slug;
}

export async function POST(req: Request) {
  const list = await getProducts();
  const p = clean(await req.json());
  p.slug = uniqueSlug(p.name, list, p.id);
  list.unshift(p);
  await saveProducts(list);
  return NextResponse.json(p);
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Partial<Product>;
  const list = await getProducts();
  const i = list.findIndex((p) => p.id === body.id);
  if (i < 0) return NextResponse.json({ error: "That item no longer exists." }, { status: 404 });
  const p = clean(body, list[i]);
  p.slug = list[i].name === p.name ? list[i].slug : uniqueSlug(p.name, list, p.id);
  list[i] = p;
  await saveProducts(list);
  return NextResponse.json(p);
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const list = await getProducts();
  await saveProducts(list.filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}

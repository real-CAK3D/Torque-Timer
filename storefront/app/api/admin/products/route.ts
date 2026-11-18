import { NextResponse } from "next/server";
import { getProducts, saveProducts } from "@/lib/db";
import { cleanProduct as clean, uniqueSlug } from "@/lib/products";
import type { Product } from "@/lib/types";

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

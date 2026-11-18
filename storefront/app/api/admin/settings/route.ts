import { NextResponse } from "next/server";
import { DEFAULT_SETTINGS, getSettings, saveSettings } from "@/lib/db";
import type { SiteSettings } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Partial<SiteSettings>;
  const patch: Record<string, unknown> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
    if (!(k in body)) continue;
    const v = body[k];
    const def = DEFAULT_SETTINGS[k];
    if (typeof def === "number") patch[k] = Math.max(0, Math.round(Number(v) || 0));
    else if (typeof def === "boolean") patch[k] = Boolean(v);
    else if (typeof def === "string") patch[k] = String(v ?? "").slice(0, 8000);
    else if (k === "shipCountries" || k === "expenseCategories")
      patch[k] = Array.isArray(v) ? v.map((x) => String(x).trim().slice(0, 40)).filter(Boolean).slice(0, 50) : def;
    else patch[k] = v;
  }
  return NextResponse.json(await saveSettings(patch as Partial<SiteSettings>));
}

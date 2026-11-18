import { NextResponse } from "next/server";
import { buildBrief, parseChanges, planChanges, undoLastImport } from "@/lib/changes";
import { getProducts, getSettings } from "@/lib/db";

export async function GET() {
  const [s, p] = await Promise.all([getSettings(), getProducts()]);
  return new Response(buildBrief(s, p), { headers: { "content-type": "text/plain; charset=utf-8" } });
}

// { text, apply?: boolean }  -> preview (apply=false) or save (apply=true)
// { undo: true }             -> restore what was there before the last import
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.undo) {
    const ok = await undoLastImport();
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "There's nothing to undo." }, { status: 400 });
  }
  const parsed = parseChanges(String(body.text ?? ""));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const plan = await planChanges(parsed.data);
  if (body.apply) {
    if (!plan.lines.length) return NextResponse.json({ error: "Nothing would change." }, { status: 400 });
    await plan.apply();
  }
  return NextResponse.json({ summary: plan.summary, lines: plan.lines, warnings: plan.warnings, applied: Boolean(body.apply) });
}

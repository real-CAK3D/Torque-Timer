import { NextResponse } from "next/server";
import { trackView } from "@/lib/db";

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|preview|lighthouse|headless/i.test(ua)) return NextResponse.json({ ok: true });
  const body = await req.json().catch(() => ({}));
  const cookie = req.headers.get("cookie") ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const newVisitor = !cookie.includes(`seen=${today}`);

  let referrer: string | undefined;
  try {
    if (body.referrer) {
      const host = new URL(body.referrer).hostname.replace(/^www\./, "");
      const own = (req.headers.get("host") ?? "").replace(/:\d+$/, "");
      if (host && host !== own) referrer = host.slice(0, 60);
    }
  } catch {}

  await trackView({ productId: typeof body.productId === "string" ? body.productId.slice(0, 40) : undefined, newVisitor, referrer }).catch(() => {});
  const res = NextResponse.json({ ok: true });
  if (newVisitor) res.cookies.set("seen", today, { maxAge: 86400 * 2, path: "/", sameSite: "lax" });
  return res;
}

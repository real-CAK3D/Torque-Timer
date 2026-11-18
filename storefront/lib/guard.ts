import "server-only";

// Light protection for public forms: a hidden "website" field bots fill in,
// and a per-visitor limit on how often the form can be sent.
const hits = new Map<string, number[]>();

export function tooMany(req: Request, max = 5, windowMs = 10 * 60_000) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 200;

import "server-only";
import { getKey } from "./keys";

/*
 *  EDIT-POINT: EMAILS
 *  Emails the site sends to customers (through Resend, if a key is saved).
 *  Stripe sends the payment receipt itself; turn that on in Stripe >
 *  Settings > Customer emails > "Successful payments".
 */

export async function emailReady(from: string) {
  return Boolean(from && (await getKey("RESEND_API_KEY")));
}

export async function sendEmail(opts: { from: string; to: string; subject: string; text: string; replyTo?: string }) {
  const key = await getKey("RESEND_API_KEY");
  if (!key || !opts.from) throw new Error("Email isn't set up. Add a Resend key under Keys and a sender address under Settings.");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: opts.from, to: [opts.to], subject: opts.subject, text: opts.text, reply_to: opts.replyTo || undefined }),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(`Email didn't send: ${body.message ?? r.statusText}`);
  }
}

const CARRIERS: Record<string, (n: string) => string> = {
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHL: (n) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
};
export const CARRIER_NAMES = Object.keys(CARRIERS);
export const trackingLink = (carrier: string | undefined, number: string) => (carrier && CARRIERS[carrier] ? CARRIERS[carrier](number) : "");

export function shippedEmail(o: { number: number; name: string; trackingNumber?: string; carrier?: string; items: { quantity: number; name: string }[] }, business: string) {
  const first = (o.name || "").split(" ")[0] || "there";
  const link = o.trackingNumber ? trackingLink(o.carrier, o.trackingNumber) : "";
  return {
    subject: `Your ${business} order #${o.number} has shipped`,
    text: [
      `Hi ${first},`,
      "",
      `Good news: order #${o.number} is on its way.`,
      "",
      ...o.items.map((i) => `  ${i.quantity} x ${i.name}`),
      "",
      o.trackingNumber ? `Tracking${o.carrier ? ` (${o.carrier})` : ""}: ${o.trackingNumber}` : "",
      link ? link : "",
      "",
      "Thanks for supporting a veteran-owned small business.",
      business,
    ]
      .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
      .join("\n"),
  };
}

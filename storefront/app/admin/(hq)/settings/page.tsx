import { headers } from "next/headers";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getPushSubs, getSettings } from "@/lib/db";
import { pushConfigured } from "@/lib/push";
import { storageMode } from "@/lib/store";
import { blobConfigured } from "@/lib/upload";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "your-site.vercel.app";
  const proto = h.get("x-forwarded-proto") || "https";
  const base = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
  const [s, subs] = await Promise.all([getSettings(), getPushSubs()]);
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const status = {
    stripe: Boolean(key),
    stripeLive: key.startsWith("sk_live") || key.startsWith("rk_live"),
    webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    redis: storageMode === "redis",
    blob: blobConfigured(),
    push: pushConfigured(),
    password: Boolean(process.env.ADMIN_PASSWORD),
    authSecret: Boolean(process.env.AUTH_SECRET),
  };
  return (
    <SettingsForm
      initial={s}
      status={status}
      webhookUrl={`${base.replace(/\/$/, "")}/api/stripe/webhook`}
      siteUrl={base}
      vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""}
      deviceCount={subs.length}
    />
  );
}

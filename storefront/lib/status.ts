import "server-only";
import { getSettings } from "./db";
import { getKey, strongEncryption } from "./keys";
import { pushConfigured } from "./push";
import { storageMode } from "./store";
import { stripe } from "./stripe";
import { supabaseStatus } from "./supabase";
import { imageStorage } from "./upload";
import { getPasswordHash } from "./password";

export type Check = { ok: boolean; detail: string };

export async function getStatus() {
  const [settings, stripeKey, webhookKey, resendKey, push, db, pwHash] = await Promise.all([
    getSettings(),
    getKey("STRIPE_SECRET_KEY"),
    getKey("STRIPE_WEBHOOK_SECRET"),
    getKey("RESEND_API_KEY"),
    pushConfigured(),
    storageMode === "supabase" ? supabaseStatus() : Promise.resolve({ ok: storageMode === "redis", message: storageMode === "redis" ? "Upstash Redis" : "Not connected" }),
    getPasswordHash(),
  ]);

  let stripeCheck: Check = { ok: false, detail: "No key yet" };
  let wallets: Check = { ok: false, detail: "Needs Stripe first" };
  if (stripeKey) {
    try {
      const s = (await stripe())!;
      const acct = await s.accounts.retrieve();
      const live = stripeKey.includes("_live_");
      stripeCheck = { ok: true, detail: `${acct.settings?.dashboard?.display_name || acct.business_profile?.name || "Connected"}${live ? " (live payments)" : " (test mode)"}` };
      wallets = { ok: true, detail: "Shown automatically at checkout when turned on in Stripe" };
    } catch (e) {
      stripeCheck = { ok: false, detail: `Stripe rejected the key: ${(e as Error).message}` };
    }
  }

  return {
    github: { ok: Boolean(process.env.VERCEL_GIT_REPO_SLUG || settings.githubRepo), detail: process.env.VERCEL_GIT_REPO_OWNER ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : settings.githubRepo || "Not linked" },
    vercel: { ok: Boolean(process.env.VERCEL), detail: process.env.VERCEL ? `Running on Vercel (${process.env.VERCEL_ENV})` : "Running on this computer" },
    database: { ok: db.ok && storageMode !== "file", detail: storageMode === "file" ? "Not connected (saving to this computer only)" : db.message },
    photos: { ok: imageStorage() !== "local", detail: imageStorage() === "supabase" ? "Supabase Storage" : imageStorage() === "blob" ? "Vercel Blob" : "Not connected" },
    password: { ok: Boolean(pwHash || process.env.ADMIN_PASSWORD), detail: pwHash ? "Set in the dashboard" : process.env.ADMIN_PASSWORD ? "Set in Vercel (ADMIN_PASSWORD)" : "Using the practice password" },
    secret: { ok: strongEncryption(), detail: strongEncryption() ? "Keys are encrypted with a private secret" : "Add AUTH_SECRET in Vercel" },
    stripe: stripeCheck,
    webhook: { ok: Boolean(webhookKey), detail: webhookKey ? "Orders and product changes arrive instantly" : "Not connected" },
    wallets,
    push: { ok: push, detail: push ? "Keys ready; turn on per device in Settings" : "No notification keys yet" },
    email: { ok: Boolean(resendKey && settings.emailFrom), detail: resendKey ? (settings.emailFrom ? "Tracking emails on" : "Add a sender address in Settings") : "Optional" },
    live: { ok: Boolean(stripeKey?.includes("_live_")), detail: stripeKey?.includes("_live_") ? "Taking real payments" : "Test mode" },
  };
}

export type Status = Awaited<ReturnType<typeof getStatus>>;

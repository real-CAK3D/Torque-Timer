import { SettingsForm } from "@/components/admin/SettingsForm";
import { getPushSubs, getSettings } from "@/lib/db";
import { getKey } from "@/lib/keys";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const [s, subs, vapid, stripeKey, resend] = await Promise.all([getSettings(), getPushSubs(), getKey("NEXT_PUBLIC_VAPID_PUBLIC_KEY"), getKey("STRIPE_SECRET_KEY"), getKey("RESEND_API_KEY")]);
  const repo = process.env.VERCEL_GIT_REPO_OWNER ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : s.githubRepo;
  return (
    <SettingsForm
      initial={s}
      vapidKey={vapid ?? ""}
      deviceCount={subs.length}
      stripeTest={Boolean(stripeKey?.includes("_test_"))}
      hasResend={Boolean(resend)}
      repo={repo}
    />
  );
}

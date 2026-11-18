import { HelpView } from "@/components/admin/HelpView";
import { getSettings } from "@/lib/db";

export const metadata = { title: "Help" };

export default async function HelpPage() {
  const repo = (await getSettings()).githubRepo.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
  const guideUrl = /^[\w.-]+\/[\w.-]+$/.test(repo) ? `https://github.com/${repo}/blob/HEAD/storefront/GUIDE.md` : "";
  return <HelpView guideUrl={guideUrl} />;
}

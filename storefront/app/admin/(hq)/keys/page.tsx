import { KeysManager } from "@/components/admin/KeysManager";
import { keyStatuses, strongEncryption } from "@/lib/keys";

export const metadata = { title: "Keys" };

export default async function KeysPage() {
  return <KeysManager initial={await keyStatuses()} strong={strongEncryption()} onVercel={Boolean(process.env.VERCEL)} />;
}

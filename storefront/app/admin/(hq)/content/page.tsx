import { ContentForm } from "@/components/admin/ContentForm";
import { getSettings } from "@/lib/db";

export const metadata = { title: "Words & logos" };

export default async function Content() {
  return <ContentForm initial={await getSettings()} />;
}

import { InboxList } from "@/components/admin/InboxList";
import { getMessages } from "@/lib/db";

export const metadata = { title: "Inbox" };

export default async function Inbox() {
  return <InboxList initial={await getMessages()} />;
}

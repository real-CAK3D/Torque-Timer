"use client";
import { useRouter } from "next/navigation";
import { api } from "./api";

export function RemoveSubscriber({ email }: { email: string }) {
  const router = useRouter();
  return (
    <button
      className="b b-ghost b-sm"
      onClick={async () => {
        if (!confirm(`Remove ${email} from the list?`)) return;
        await api("/api/admin/messages", "POST", { action: "unsubscribe", email });
        router.refresh();
      }}
    >
      Remove
    </button>
  );
}

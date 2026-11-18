import Link from "next/link";
import { storageMode } from "@/lib/store";
import { blobConfigured } from "@/lib/upload";
import { pushConfigured } from "@/lib/push";

export function SetupChecklist() {
  const items = [
    { ok: Boolean(process.env.STRIPE_SECRET_KEY), label: "Connect Stripe so customers can pay" },
    { ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET), label: "Add the Stripe webhook so orders arrive instantly" },
    { ok: storageMode === "redis", label: "Connect Upstash Redis so your changes are saved" },
    { ok: blobConfigured(), label: "Connect Vercel Blob so you can upload photos" },
    { ok: pushConfigured(), label: "Add notification keys for phone alerts" },
  ];
  const todo = items.filter((i) => !i.ok);
  if (!todo.length) return null;
  return (
    <section className="panel setup">
      <div className="panel-head"><h2>Finish setting up</h2><Link href="/admin/settings">Open settings</Link></div>
      <ul className="checks">
        {items.map((i) => (
          <li key={i.label} className={i.ok ? "done" : ""}>{i.label}</li>
        ))}
      </ul>
    </section>
  );
}

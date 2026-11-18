import { ChatGPTHelper } from "@/components/admin/ChatGPTHelper";
import { buildBrief, getBackupTime } from "@/lib/changes";
import { getProducts, getSettings } from "@/lib/db";
import { LAYOUTS, THEMES } from "@/lib/themes";
import { PRODUCT_VARS, SETTING_VARS } from "@/lib/variables";

export const metadata = { title: "ChatGPT helper" };

export default async function ChatGPTPage() {
  const [s, products, backupAt] = await Promise.all([getSettings(), getProducts(), getBackupTime()]);
  const vars = SETTING_VARS.map((v) => {
    const raw = s[v.key as keyof typeof s];
    let current =
      v.kind === "money" ? `$${((raw as number) / 100).toFixed(2)}`
      : typeof raw === "boolean" ? (raw ? "Yes" : "No")
      : typeof raw === "object" ? JSON.stringify(raw)
      : String(raw ?? "");
    if (v.key === "theme") current = THEMES.find((t) => t.id === raw)?.name ?? current;
    if (v.key === "layout") current = LAYOUTS.find((l) => l.id === raw)?.name ?? current;
    return { key: v.key, group: v.group, what: v.what, current };
  });
  return (
    <ChatGPTHelper
      brief={buildBrief(s, products)}
      vars={vars}
      productVars={PRODUCT_VARS}
      products={products.map((p) => ({ slug: p.slug, name: p.name, active: p.active }))}
      backupAt={backupAt}
    />
  );
}

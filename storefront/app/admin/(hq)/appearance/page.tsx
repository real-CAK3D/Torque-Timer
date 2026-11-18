import { AppearanceForm } from "@/components/admin/AppearanceForm";
import { getSettings } from "@/lib/db";
import { fontHref, LAYOUTS, THEMES } from "@/lib/themes";

export const metadata = { title: "Look & layout" };

export default async function Appearance() {
  return (
    <>
      {THEMES.map((t) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={t.id} rel="stylesheet" href={fontHref(t)} />
      ))}
      <AppearanceForm initial={await getSettings()} themes={THEMES} layouts={LAYOUTS} />
    </>
  );
}

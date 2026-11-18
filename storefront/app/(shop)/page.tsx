import { FieldManual } from "@/components/shop/layouts/FieldManual";
import { Garrison } from "@/components/shop/layouts/Garrison";
import { Quartermaster } from "@/components/shop/layouts/Quartermaster";
import { Showroom } from "@/components/shop/layouts/Showroom";
import { ThemeStyle } from "@/components/shop/ThemeStyle";
import { Tracker } from "@/components/shop/Tracker";
import { getActiveProducts, getSettings } from "@/lib/db";
import { getLayout, getTheme, THEMES } from "@/lib/themes";

export default async function Home({ searchParams }: { searchParams: Promise<{ theme?: string; layout?: string }> }) {
  const sp = await searchParams;
  const [s, products] = await Promise.all([getSettings(), getActiveProducts()]);
  const previewTheme = sp.theme && THEMES.some((t) => t.id === sp.theme) ? getTheme(sp.theme) : null;
  const layout = getLayout(sp.layout || s.layout).id;
  const props = { s, products };
  return (
    <>
      {previewTheme ? <ThemeStyle theme={previewTheme} /> : null}
      {!sp.theme && !sp.layout ? <Tracker /> : null}
      <div className={`home layout-${layout}`}>
        {layout === "field-manual" ? <FieldManual {...props} /> : layout === "showroom" ? <Showroom {...props} /> : layout === "quartermaster" ? <Quartermaster {...props} /> : <Garrison {...props} />}
      </div>
    </>
  );
}

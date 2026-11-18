import { viewsFor } from "@/components/shop/layouts";
import { ThemeStyle } from "@/components/shop/ThemeStyle";
import { Tracker } from "@/components/shop/Tracker";
import { getActiveProducts, getSettings } from "@/lib/db";
import { getLayout, getTheme, THEMES } from "@/lib/themes";

// ?theme= and ?layout= are only used by the preview on the Look & layout page.
export default async function Home({ searchParams }: { searchParams: Promise<{ theme?: string; layout?: string }> }) {
  const sp = await searchParams;
  const [s, products] = await Promise.all([getSettings(), getActiveProducts()]);
  const previewTheme = sp.theme && THEMES.some((t) => t.id === sp.theme) ? getTheme(sp.theme) : null;
  const layout = getLayout(sp.layout || s.layout).id;
  const { Home: View } = viewsFor(layout);
  return (
    <>
      {previewTheme ? <ThemeStyle theme={previewTheme} /> : null}
      {!sp.theme && !sp.layout ? <Tracker /> : null}
      <div className={`home layout-${layout}`}>
        <View s={s} products={products} />
      </div>
    </>
  );
}

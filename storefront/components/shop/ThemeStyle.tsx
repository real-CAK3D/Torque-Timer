import { fontHref, themeCss, type Theme } from "@/lib/themes";

export function ThemeStyle({ theme }: { theme: Theme }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontHref(theme)} />
      <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
    </>
  );
}

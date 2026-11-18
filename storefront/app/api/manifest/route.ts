import { getSettings } from "@/lib/db";
import { getTheme } from "@/lib/themes";

// The installable app is the owner's dashboard. Customers never get this manifest.
export async function GET() {
  const s = await getSettings();
  const t = getTheme(s.theme);
  /*
   * EDIT-POINT: APP-ICON
   * How the dashboard installs on a phone home screen (name, colors, icons).
   * Replace the PNGs in public/icons/ (192, 512 and apple-touch-icon 180 px)
   * to change the app icon.
   */
  const manifest = {
    name: `${s.businessName} HQ`,
    short_name: "Shop HQ",
    description: "Orders, sales and settings for your shop.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#101312",
    theme_color: t.colors.band,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { "content-type": "application/manifest+json" } });
}

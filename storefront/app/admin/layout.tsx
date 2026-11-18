import type { Metadata, Viewport } from "next";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Shop HQ", template: "%s | Shop HQ" },
  manifest: "/api/manifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Shop HQ", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16241D" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1311" },
  ],
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Saira+Stencil+One&display=swap" />
      <div className="hq">{children}</div>
    </>
  );
}

import type { SiteSettings } from "@/lib/types";
import { Emblem, initialsOf } from "./Emblem";

export function Logo({ s, size = 44 }: { s: SiteSettings; size?: number }) {
  if (s.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={s.logo} alt={s.businessName} style={{ height: size, width: "auto" }} className="logo-img" />;
  }
  return <Emblem initials={initialsOf(s.businessName)} size={size} />;
}

export function Patch({ s, size = 180 }: { s: SiteSettings; size?: number }) {
  const src = s.emblem || s.logo;
  return (
    <div className="patch" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        <Emblem initials={initialsOf(s.businessName)} size={size * 0.66} />
      )}
    </div>
  );
}

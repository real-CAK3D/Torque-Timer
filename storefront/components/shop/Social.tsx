import type { SocialLinks } from "@/lib/types";

/*
 * EDIT-POINT: SOCIAL-NETWORKS
 * Social sites shown in the footer/contact. To add one (e.g. pinterest):
 * add it here, to SocialLinks in lib/types.ts, to "social" in
 * lib/site-variables-type.ts and site-variables.ts, and to the Words & logos
 * form (components/admin/ContentForm.tsx).
 */
const NAMES: Record<keyof SocialLinks, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  etsy: "Etsy",
};

export function Social({ links }: { links: SocialLinks }) {
  const entries = (Object.keys(NAMES) as (keyof SocialLinks)[]).filter((k) => links[k]);
  if (!entries.length) return null;
  return (
    <ul className="social">
      {entries.map((k) => (
        <li key={k}>
          <a href={links[k]} target="_blank" rel="noreferrer">
            {NAMES[k]}
          </a>
        </li>
      ))}
    </ul>
  );
}

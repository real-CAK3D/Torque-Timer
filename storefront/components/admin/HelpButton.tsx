"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { topicForPath } from "@/lib/help";

export function HelpButton() {
  const path = usePathname();
  const onHelp = path.startsWith("/admin/help");
  return (
    <Link href={onHelp ? "/admin/help" : `/admin/help#${topicForPath(path)}`} className="bell" aria-label="Help for this page" title="Help">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.3-2.5 3.8" />
        <path d="M12 17.2v.01" />
      </svg>
    </Link>
  );
}

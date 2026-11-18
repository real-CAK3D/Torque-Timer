// Built-in badge used until a logo is uploaded. Colors follow the active theme.
/*
 * EDIT-POINT: EMBLEM
 * The built-in shield badge shown until a logo is uploaded. It's an SVG
 * drawing; colors come from the active theme.
 */
export function Emblem({ initials, size = 96 }: { initials: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`${initials} emblem`} className="emblem">
      <path d="M60 6 L106 22 V60 C106 88 86 106 60 114 C34 106 14 88 14 60 V22 Z" fill="var(--band)" stroke="var(--stitch)" strokeWidth="4" />
      <path d="M60 15 L98 28 V60 C98 83 82 98 60 105 C38 98 22 83 22 60 V28 Z" fill="none" stroke="var(--stitch)" strokeWidth="1.6" strokeDasharray="3 3" />
      <path d="M60 30 l4.4 9 9.9 1.4 -7.2 7 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.2 -7 9.9 -1.4 z" fill="var(--stitch)" />
      <text x="60" y="88" textAnchor="middle" fill="var(--band-ink)" fontFamily="var(--font-display)" fontSize="22" letterSpacing="1">
        {initials}
      </text>
    </svg>
  );
}

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter((w) => /^[A-Za-z0-9]/.test(w) && !["and", "&", "the", "of"].includes(w.toLowerCase()))
      .slice(0, 3)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "★"
  );
}

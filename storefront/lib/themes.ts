export type Theme = {
  id: string;
  name: string;
  description: string;
  fonts: { display: string; body: string };
  displayCase: "uppercase" | "none";
  displayTracking: string;
  radius: string;
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    ink: string;
    muted: string;
    line: string;
    accent: string;
    accentInk: string;
    band: string; // header band
    bandInk: string;
    stitch: string; // patch stitching
  };
};

/*
 * EDIT-POINT: THEMES
 * The color + font themes the owner picks under Look & layout.
 * Add a theme: copy one { ... } entry below, give it a new unique id and name,
 * and change the colors (hex) and Google Font names. It shows up automatically.
 *   bg/surface/surface2 = page and card backgrounds   ink/muted = text
 *   accent = buttons   band = header/footer   stitch = patch stitching + highlights
 * Fonts must be on fonts.google.com, spelled exactly as listed there.
 */
export const THEMES: Theme[] = [
  {
    id: "military-police",
    name: "Military Police",
    description: "MP branch green and gold with a black brassard band.",
    fonts: { display: "Saira Stencil One", body: "Barlow" },
    displayCase: "uppercase",
    displayTracking: "0.02em",
    radius: "4px",
    colors: {
      bg: "#F3F2EC",
      surface: "#FFFFFF",
      surface2: "#E6E5DC",
      ink: "#15181A",
      muted: "#555B57",
      line: "#CFCEC3",
      accent: "#1E4D36",
      accentInk: "#FFFFFF",
      band: "#121314",
      bandInk: "#F2C84B",
      stitch: "#C9A227",
    },
  },
  {
    id: "olive-drab",
    name: "Olive Drab",
    description: "Field-issue OD green, canvas and stenciled type.",
    fonts: { display: "Big Shoulders Stencil Display", body: "Barlow" },
    displayCase: "uppercase",
    displayTracking: "0.03em",
    radius: "2px",
    colors: {
      bg: "#E9E4D3",
      surface: "#F6F2E6",
      surface2: "#DAD3BC",
      ink: "#22251A",
      muted: "#585B48",
      line: "#C4BCA2",
      accent: "#4B5320",
      accentInk: "#F6F2E6",
      band: "#3A4019",
      bandInk: "#EDE6CC",
      stitch: "#9AA161",
    },
  },
  {
    id: "ocp-field",
    name: "OCP Field",
    description: "Coyote brown and sand from the operational camo pattern.",
    fonts: { display: "Oswald", body: "Barlow" },
    displayCase: "uppercase",
    displayTracking: "0.01em",
    radius: "6px",
    colors: {
      bg: "#EDE5D3",
      surface: "#FAF6EC",
      surface2: "#DCCFB4",
      ink: "#2B2419",
      muted: "#6A5D48",
      line: "#CDBF9F",
      accent: "#7A5C3C",
      accentInk: "#FFFFFF",
      band: "#5C4A33",
      bandInk: "#F0E6CF",
      stitch: "#A38B6D",
    },
  },
  {
    id: "dress-blues",
    name: "Dress Blues",
    description: "Army Service Uniform blue with polished gold.",
    fonts: { display: "Cinzel", body: "Source Sans 3" },
    displayCase: "none",
    displayTracking: "0.01em",
    radius: "3px",
    colors: {
      bg: "#F4F3EF",
      surface: "#FFFFFF",
      surface2: "#E5E6EC",
      ink: "#141B2E",
      muted: "#4F5770",
      line: "#CDD0DA",
      accent: "#1C2841",
      accentInk: "#F3D77A",
      band: "#1C2841",
      bandInk: "#E3C463",
      stitch: "#D4AF37",
    },
  },
  {
    id: "night-patrol",
    name: "Night Patrol",
    description: "Dark mode for after lights-out, with steel-blue highlights.",
    fonts: { display: "Chakra Petch", body: "Barlow" },
    displayCase: "uppercase",
    displayTracking: "0.02em",
    radius: "4px",
    colors: {
      bg: "#16191D",
      surface: "#1F2328",
      surface2: "#292E35",
      ink: "#E8ECEF",
      muted: "#A1AAB3",
      line: "#363C44",
      accent: "#8FB3D4",
      accentInk: "#0F1A25",
      band: "#0D0F12",
      bandInk: "#C6D7E6",
      stitch: "#5D7A94",
    },
  },
  {
    id: "old-glory",
    name: "Old Glory",
    description: "Flag navy and red on crisp white.",
    fonts: { display: "Alfa Slab One", body: "Libre Franklin" },
    displayCase: "none",
    displayTracking: "0",
    radius: "4px",
    colors: {
      bg: "#FFFFFF",
      surface: "#F5F6F9",
      surface2: "#E7EAF1",
      ink: "#0A1B33",
      muted: "#4E5A6E",
      line: "#D5DAE4",
      accent: "#B31942",
      accentInk: "#FFFFFF",
      band: "#0A3161",
      bandInk: "#FFFFFF",
      stitch: "#B31942",
    },
  },
  {
    id: "brass-leather",
    name: "Brass & Leather",
    description: "Workshop browns and brass, for handmade goods.",
    fonts: { display: "Bitter", body: "Bitter" },
    displayCase: "none",
    displayTracking: "0",
    radius: "8px",
    colors: {
      bg: "#2A1E16",
      surface: "#35271D",
      surface2: "#423125",
      ink: "#F1E6D6",
      muted: "#C3B096",
      line: "#54402F",
      accent: "#C99A3E",
      accentInk: "#24180F",
      band: "#1E150F",
      bandInk: "#E2BC6A",
      stitch: "#C99A3E",
    },
  },
  {
    id: "clean-dispatch",
    name: "Clean Dispatch",
    description: "Plain, bright and modern. No uniform required.",
    fonts: { display: "Archivo", body: "Archivo" },
    displayCase: "none",
    displayTracking: "-0.01em",
    radius: "10px",
    colors: {
      bg: "#FAFAFA",
      surface: "#FFFFFF",
      surface2: "#EFEFEF",
      ink: "#161616",
      muted: "#5E5E5E",
      line: "#DEDEDE",
      accent: "#1F5AA6",
      accentInk: "#FFFFFF",
      band: "#FFFFFF",
      bandInk: "#161616",
      stitch: "#9DB4D2",
    },
  },
];

export type Layout = { id: string; name: string; description: string; sketch: string };

/*
 * EDIT-POINT: LAYOUTS
 * How the home page and the Shop page are arranged. Each id here has a file in
 * components/shop/layouts/ with a Home and a Catalog view, listed in
 * components/shop/layouts/index.tsx. To add one: copy a layout file, rename
 * the two functions, add them to index.tsx and add an entry here.
 */
export const LAYOUTS: Layout[] = [
  {
    id: "garrison",
    name: "Garrison",
    description: "Big welcome with your patch, featured items and category tiles. Shop page is a grid.",
    sketch: "▬▬▬▬▬▬\n  ◉ HERO  \n▢ ▢ ▢ ▢\n▢ ▢ ▢ ▢\n ABOUT ",
  },
  {
    id: "field-manual",
    name: "Field Manual",
    description: "Sidebar with your categories on every page; pick one to see just those items.",
    sketch: "▌▢ ▢ ▢\n▌▢ ▢ ▢\n▌▢ ▢ ▢\n▌      ",
  },
  {
    id: "showroom",
    name: "Showroom",
    description: "Full-width photo up top and large, story-style rows for each item.",
    sketch: "██████\n██████\n▢▢ ═══\n═══ ▢▢",
  },
  {
    id: "quartermaster",
    name: "Quartermaster",
    description: "Compact list with add-to-cart buttons. Best when there are lots of items.",
    sketch: "▬▬▬▬▬▬\n▪ ─── $\n▪ ─── $\n▪ ─── $",
  },
];

export function getTheme(id: string | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function getLayout(id: string | undefined): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function themeCss(t: Theme): string {
  const c = t.colors;
  return `:root{--bg:${c.bg};--surface:${c.surface};--surface-2:${c.surface2};--ink:${c.ink};--muted:${c.muted};--line:${c.line};--accent:${c.accent};--accent-ink:${c.accentInk};--band:${c.band};--band-ink:${c.bandInk};--stitch:${c.stitch};--radius:${t.radius};--font-display:'${t.fonts.display}',system-ui,sans-serif;--font-body:'${t.fonts.body}',system-ui,sans-serif;--display-case:${t.displayCase};--display-tracking:${t.displayTracking};color-scheme:${isDark(c.bg) ? "dark" : "light"}}`;
}

export function fontHref(t: Theme): string {
  const fam = (f: string, weights: string) => `family=${f.replace(/ /g, "+")}:wght@${weights}`;
  const parts =
    t.fonts.display === t.fonts.body
      ? [fam(t.fonts.body, "400;500;600;700;800")]
      : [singleWeight(t.fonts.display) ? `family=${t.fonts.display.replace(/ /g, "+")}` : fam(t.fonts.display, "500;700;800"), fam(t.fonts.body, "400;500;600;700")];
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

function singleWeight(f: string) {
  return ["Saira Stencil One", "Alfa Slab One"].includes(f);
}

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
}

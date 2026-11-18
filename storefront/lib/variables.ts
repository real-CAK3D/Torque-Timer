/*
 * ============================================================================
 *  EDIT-POINT: SITE-VARIABLES
 *  The list of everything the owner (or ChatGPT) can change without code.
 *  It powers the "ChatGPT helper" page in the dashboard and the brief that
 *  gets copied to ChatGPT.
 *
 *  To make a new setting editable through ChatGPT:
 *    1. Add the field to SiteSettings in lib/types.ts
 *    2. Give it a default in DEFAULT_SETTINGS in lib/db.ts
 *    3. Add a line below so ChatGPT knows what it is
 * ============================================================================
 */

export type VarKind = "text" | "longtext" | "money" | "number" | "yesno" | "choice" | "image" | "links" | "social";

export type VarDoc = { key: string; kind: VarKind; group: string; what: string; choices?: string[] };

export const SETTING_VARS: VarDoc[] = [
  // Brand & words
  { key: "businessName", kind: "text", group: "Brand", what: "Business name. Shown in the header, footer and browser tab." },
  { key: "tagline", kind: "text", group: "Brand", what: "One short line about the business. Used in search results and the Field Manual sidebar." },
  { key: "announcement", kind: "text", group: "Brand", what: "Thin banner across the very top of every page. Empty string hides it." },
  { key: "heroHeadline", kind: "text", group: "Welcome section", what: "Big headline at the top of the home page. Keep it under about 8 words." },
  { key: "heroText", kind: "longtext", group: "Welcome section", what: "One or two sentences under the headline." },
  { key: "aboutTitle", kind: "text", group: "About", what: "Heading of the About section." },
  { key: "about", kind: "longtext", group: "About", what: "The owner's story. Separate paragraphs with a blank line (\\n\\n)." },
  { key: "serviceLine", kind: "text", group: "About", what: "Service line shown in the veteran badge and footer, e.g. \"U.S. Army Military Police, 2004–2012\"." },
  { key: "showVeteranBadge", kind: "yesno", group: "About", what: "Show the star badge with the service line." },
  { key: "shippingPolicy", kind: "longtext", group: "Policies", what: "Shipping info shown on product pages, the footer and the thank-you page." },
  { key: "returnPolicy", kind: "longtext", group: "Policies", what: "Returns info shown in the footer." },
  // Contact
  { key: "contactEmail", kind: "text", group: "Contact", what: "Public email address." },
  { key: "contactPhone", kind: "text", group: "Contact", what: "Public phone number." },
  { key: "location", kind: "text", group: "Contact", what: "City/state shown in the contact section." },
  { key: "social", kind: "social", group: "Contact", what: "Social links. Object with any of: facebook, instagram, tiktok, youtube, x, etsy. Each is a full https:// URL or \"\" to remove." },
  // Look
  { key: "theme", kind: "choice", group: "Look", what: "Color/font theme.", choices: [] },
  { key: "layout", kind: "choice", group: "Look", what: "Home page layout.", choices: [] },
  // Store
  { key: "storeOpen", kind: "yesno", group: "Store", what: "false pauses ordering (shop stays visible)." },
  { key: "closedMessage", kind: "text", group: "Store", what: "Message shown while the store is closed." },
  { key: "collectShipping", kind: "yesno", group: "Store", what: "Ask for a shipping address and charge shipping." },
  { key: "shippingFlat", kind: "money", group: "Store", what: "Flat shipping price per order, in dollars." },
  { key: "freeShippingOver", kind: "money", group: "Store", what: "Orders at or above this many dollars ship free. 0 = never free." },
  { key: "lowStockAlert", kind: "number", group: "Store", what: "Warn the owner when an item's stock drops to this number." },
  // Images
  { key: "logo", kind: "image", group: "Images", what: "Main logo URL. Upload images in the dashboard; only change this to \"\" to remove or to an https:// URL the owner gives you." },
  { key: "emblem", kind: "image", group: "Images", what: "Round patch image URL (uses the logo if empty)." },
  { key: "favicon", kind: "image", group: "Images", what: "Browser tab icon URL." },
  { key: "heroImage", kind: "image", group: "Images", what: "Wide welcome photo URL (Showroom layout)." },
  { key: "aboutImage", kind: "image", group: "Images", what: "About section photo URL." },
  // Owner tools
  { key: "customLinks", kind: "links", group: "Owner tools", what: "Shortcut links on the owner's Settings page. List of { \"label\": \"...\", \"url\": \"https://...\" }. Sending this replaces the whole list." },
  { key: "githubRepo", kind: "text", group: "Owner tools", what: "GitHub repository, e.g. owner/repo." },
  { key: "vercelProject", kind: "text", group: "Owner tools", what: "Vercel team/project, e.g. my-team/my-shop." },
];

export const PRODUCT_VARS: { key: string; what: string }[] = [
  { key: "slug", what: "The item's ID in the web address. Use it to point at an existing item in update/remove. Don't make one up for new items; it's created from the name." },
  { key: "name", what: "Item name." },
  { key: "price", what: "Price in dollars, e.g. 45 or 45.50." },
  { key: "compareAtPrice", what: "Optional \"was\" price in dollars to show a sale. null removes it." },
  { key: "summary", what: "One line shown on the shop page cards (max 300 characters)." },
  { key: "description", what: "Full description on the item's page. Blank line (\\n\\n) between paragraphs." },
  { key: "category", what: "Category name. Items with the same category are grouped together." },
  { key: "stock", what: "How many are in stock. null = unlimited." },
  { key: "madeToOrder", what: "true shows \"Made to order\"." },
  { key: "featured", what: "true puts it in the Featured row." },
  { key: "active", what: "false hides it from customers without deleting it." },
  { key: "option", what: "One customer choice, e.g. { \"label\": \"Color\", \"values\": [\"Black\", \"Brown\"] }. null removes it." },
  { key: "images", what: "List of photo URLs. Leave this out to keep the current photos. Photos are uploaded in the dashboard." },
];

export const EXPENSE_VARS = "expenses.add: list of { \"date\": \"YYYY-MM-DD\", \"description\": \"...\", \"category\": \"Materials|Tools|Shipping supplies|Postage|Fees|Marketing|Software|Other\", \"amount\": dollars }";

/** Places in the code marked with "EDIT-POINT: NAME". Listed in CUSTOMIZE.md and in the ChatGPT brief. */
export const EDIT_POINTS: { name: string; file: string; what: string }[] = [
  { name: "THEMES", file: "lib/themes.ts", what: "add or change color/font themes" },
  { name: "LAYOUTS", file: "lib/themes.ts", what: "list of home page layouts" },
  { name: "STOREFRONT-STYLES", file: "app/shop.css", what: "shape, spacing and sizes on the shop" },
  { name: "HOME-PAGE-SECTIONS", file: "components/shop/Sections.tsx", what: "fixed headings like \"Get in touch\"" },
  { name: "NAV-LINKS", file: "components/shop/Header.tsx", what: "menu links in the shop's top bar" },
  { name: "FOOTER", file: "components/shop/Footer.tsx", what: "small print at the bottom" },
  { name: "EMBLEM", file: "components/shop/Emblem.tsx", what: "built-in badge shown before a logo is uploaded" },
  { name: "SOCIAL-NETWORKS", file: "components/shop/Social.tsx", what: "which social sites can be linked" },
  { name: "CHECKOUT", file: "app/api/checkout/route.ts", what: "Stripe checkout options" },
  { name: "SHIPPING-COUNTRIES", file: "app/api/checkout/route.ts", what: "countries you ship to" },
  { name: "DEFAULT-TEXT", file: "lib/db.ts", what: "starting words/settings for a fresh site" },
  { name: "SAMPLE-PRODUCTS", file: "lib/db.ts", what: "demo items on first run" },
  { name: "NOTIFICATION-TEXT", file: "lib/orders.ts", what: "wording of new-order phone alerts" },
  { name: "EXPENSE-CATEGORIES", file: "components/admin/ExpenseManager.tsx", what: "expense dropdown categories" },
  { name: "ADMIN-MENU", file: "components/admin/AdminNav.tsx", what: "owner dashboard menu" },
  { name: "APP-ICON", file: "app/api/manifest/route.ts", what: "home-screen app name and icon" },
  { name: "LOGIN", file: "lib/auth.ts", what: "how long the owner stays logged in" },
  { name: "SITE-VARIABLES", file: "lib/variables.ts", what: "what ChatGPT is allowed to change" },
  { name: "CHATGPT-FORMAT", file: "lib/changes.ts", what: "the paste-in format and the brief" },
];

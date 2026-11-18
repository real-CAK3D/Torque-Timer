/*
 * The shape of site-variables.ts. If an edit to that file doesn't match this
 * shape (a typo, a missing comma, a theme name that doesn't exist), Vercel's
 * build fails and the current live site stays up untouched.
 */

export type ThemeId =
  | "military-police"
  | "olive-drab"
  | "ocp-field"
  | "dress-blues"
  | "night-patrol"
  | "old-glory"
  | "brass-leather"
  | "clean-dispatch";

export type LayoutId = "garrison" | "field-manual" | "showroom" | "quartermaster";

export type VariableProduct = {
  slug: string;
  name: string;
  price: number;
  wasPrice?: number | null;
  summary: string;
  description: string;
  category: string;
  stock: number | null;
  madeToOrder?: boolean;
  featured?: boolean;
  visible?: boolean;
  choice?: { label: string; options: string[] } | null;
  photos?: string[];
};

export type SiteVariables = {
  brand: { businessName: string; tagline: string; announcement: string };
  homePage: { headline: string; intro: string; featuredHeading: string; allItemsHeading: string };
  about: { heading: string; story: string; serviceLine: string; showVeteranBadge: boolean };
  contact: { heading: string; text: string; email: string; phone: string; location: string; showContactForm: boolean };
  newsletter: { show: boolean; text: string };
  social: { facebook: string; instagram: string; tiktok: string; youtube: string; x: string; etsy: string };
  policies: { shipping: string; returns: string; privacy: string; terms: string };
  images: { logo: string; patch: string; tabIcon: string; welcomePhoto: string; aboutPhoto: string };
  look: { theme: ThemeId; layout: LayoutId };
  store: {
    open: boolean;
    closedMessage: string;
    askForShippingAddress: boolean;
    shippingPrice: number;
    freeShippingOver: number;
    shipToCountries: string[];
    lowStockAlert: number;
    allowPromoCodes: boolean;
    salesTaxByStripe: boolean;
    emailFrom: string;
  };
  owner: {
    expenseCategories: string[];
    githubRepo: string;
    vercelProject: string;
    links: { label: string; url: string }[];
  };
  products: VariableProduct[];
};

export type ProductOption = { label: string; values: string[] };

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number; // in cents
  compareAtPrice?: number | null; // cents, shows a "was" price
  summary: string; // one or two lines for cards
  description: string; // full details, paragraphs separated by blank lines
  category: string;
  images: string[];
  stock: number | null; // null = unlimited / made to order
  madeToOrder: boolean;
  featured: boolean;
  active: boolean; // visible to customers
  option?: ProductOption | null;
  // Set when the item comes from Stripe (Stripe > Product catalog)
  stripeProductId?: string;
  stripeStockSeen?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  option?: string;
  quantity: number;
  unitAmount: number; // cents
};

export type OrderStatus = "paid" | "shipped" | "delivered" | "refunded" | "cancelled";

export type Order = {
  id: string; // Stripe checkout session id
  number: number;
  createdAt: string;
  email: string;
  name: string;
  phone?: string;
  shippingAddress?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  tax?: number;
  promoCode?: string;
  trackingNumber?: string;
  carrier?: string;
  shippedEmailAt?: string;
  total: number;
  currency: string;
  paymentMethod?: string;
  status: OrderStatus;
  note?: string;
};

export type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: string;
  amount: number; // cents
};

export type AppNotification = {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  url?: string;
  read: boolean;
};

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  x?: string;
  etsy?: string;
};

export type CustomLink = { label: string; url: string };

export type SiteSettings = {
  // Brand
  businessName: string;
  tagline: string;
  logo: string; // main logo image url ("" = built-in emblem)
  emblem: string; // secondary badge / patch image
  favicon: string;
  heroImage: string;
  aboutImage: string;
  // Words
  announcement: string;
  heroHeadline: string;
  heroText: string;
  featuredHeading: string;
  allItemsHeading: string;
  contactHeading: string;
  contactText: string;
  aboutTitle: string;
  about: string;
  serviceLine: string; // e.g. "U.S. Army Military Police, 2004–2012"
  showVeteranBadge: boolean;
  shippingPolicy: string;
  returnPolicy: string;
  privacyPolicy: string;
  termsOfService: string;
  showContactForm: boolean;
  showNewsletter: boolean;
  newsletterText: string;
  // Contact
  contactEmail: string;
  contactPhone: string;
  location: string;
  social: SocialLinks;
  // Look
  theme: string;
  layout: string;
  // Store
  currency: string;
  shippingFlat: number; // cents
  freeShippingOver: number; // cents, 0 = never
  collectShipping: boolean;
  storeOpen: boolean;
  closedMessage: string;
  lowStockAlert: number;
  shipCountries: string[];
  allowPromoCodes: boolean;
  stripeTax: boolean;
  emailFrom: string; // sender for customer emails, e.g. "My Shop <orders@myshop.com>"
  // Owner tools
  githubRepo: string;
  vercelProject: string;
  customLinks: CustomLink[];
  expenseCategories: string[];
};

export type Message = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
};

export type Subscriber = { email: string; createdAt: string };

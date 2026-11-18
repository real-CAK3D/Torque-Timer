/*
 *  EDIT-POINT: SITE-VARIABLES
 *  Every word, price, product and setting on the shop, in one file.
 *
 *  HOW TO CHANGE THE SITE WITH CHATGPT
 *  1. On GitHub, open this file and click the "Copy raw file" button.
 *  2. Paste it into ChatGPT and say what you want, for example:
 *       "Add a walnut pen for $35, 10 in stock, in Woodwork. Write the descriptions."
 *       "Rewrite my about story. I was an MP from 2006 to 2014."
 *       "Put everything in Leather on sale for 15% off."
 *       "Switch to the Dress Blues theme."
 *  3. Copy the whole file ChatGPT gives back.
 *  4. On GitHub, click the pencil (Edit), select everything, paste, then click
 *     "Commit changes". The site updates by itself in about a minute.
 *
 *  If something goes wrong, nothing breaks: Vercel won't publish a file with a
 *  mistake in it, and the current site stays up. Open the commit on GitHub and
 *  click "Revert", or ask ChatGPT to fix the error message Vercel emails you.
 *
 *  RULES FOR CHATGPT (read these before editing this file)
 *  - Return the COMPLETE file every time, from the first line to the last.
 *  - Only change the values the owner asked about. Keep every key, every
 *    comment, the import line and the "satisfies SiteVariables" line at the end.
 *  - Text goes in "double quotes". Use \n\n inside text for a new paragraph.
 *    Write apostrophes as ' and avoid curly quotes.
 *  - Prices are plain numbers in dollars: 35 or 35.5 (no $ sign, no quotes).
 *  - Each product needs a unique "slug": lowercase words joined by dashes,
 *    e.g. "walnut-pen". The slug becomes the item's web address. Don't change
 *    the slug of an existing item unless asked.
 *  - Removing a product from the list removes it from the shop. To hide it but
 *    keep it, set visible: false.
 *  - theme must be one of: "military-police", "olive-drab", "ocp-field",
 *    "dress-blues", "night-patrol", "old-glory", "brass-leather", "clean-dispatch".
 *  - layout must be one of: "garrison", "field-manual", "showroom", "quartermaster".
 *  - Photos: never invent links. Use photos the owner uploaded to the
 *    storefront/public/images folder on GitHub, written as "/images/file-name.jpg",
 *    or leave photos out and he adds them in the dashboard.
 *  - If a request can't be done in this file, say so and name the closest
 *    "EDIT-POINT" from CUSTOMIZE.md instead of guessing.
 *
 *  HOW THIS FILE AND THE DASHBOARD WORK TOGETHER
 *  The dashboard can change most of these too. When this file changes, only the
 *  values that changed here are applied. Everything else keeps what was set in
 *  the dashboard. Whichever was changed most recently wins.
 *  Orders, expenses and customers live in the dashboard, not here.
 */

import type { SiteVariables } from "./lib/site-variables-type";

export const SITE_VARIABLES = {
  // Brand
  brand: {
    businessName: "Your Business Name", // header, footer, browser tab
    tagline: "Veteran-owned. Handmade with discipline.", // search results and the Field Manual sidebar
    announcement: "Veteran owned and operated. Every order packed by hand.", // thin banner on top of every page; "" hides it
  },

  // Home page
  homePage: {
    headline: "Built to standard. Made by hand.", // big headline; best under 8 words
    intro:
      "Small-batch goods made in a home workshop by a U.S. Army Military Police veteran. Every piece gets the same attention to detail as a pre-inspection.",
    featuredHeading: "Featured", // above items marked featured: true
    allItemsHeading: "Everything else", // above the rest of the items
  },

  // About
  about: {
    heading: "About the maker",
    story:
      "Tell your story here. Where you served, what you make, and why you make it.\n\nCustomers love knowing who is behind the work. A few short paragraphs is plenty.",
    serviceLine: "U.S. Army Military Police veteran", // e.g. "U.S. Army Military Police, 2004-2012"
    showVeteranBadge: true, // the star badge with the service line
  },

  // Contact
  contact: {
    heading: "Get in touch",
    text: "Custom orders, questions or a status check on your order.",
    email: "", // public email; "" hides it
    phone: "", // public phone; "" hides it
    location: "", // e.g. "Fort Leonard Wood, MO"
    showContactForm: true, // a message form customers can fill in; messages land in the dashboard Inbox
  },

  // Newsletter
  newsletter: {
    show: true, // email sign-up box in the footer; the list is under Customers in the dashboard
    text: "New items and restocks, a few times a year. No spam.",
  },

  // Social
  // Full web addresses starting with https://   "" hides that button.
  social: {
    facebook: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    x: "",
    etsy: "",
  },

  // Policies
  policies: {
    shipping:
      "Orders ship within 3-5 business days. Made-to-order items may take a little longer; you'll get an email when yours ships.",
    returns: "If something isn't right, reach out within 30 days and we'll make it right.",
    // Shown at /policies/privacy and /policies/terms, linked in the footer. These are plain starting
    // points, not legal advice. {business} and {email} are filled in automatically.
    privacy:
      "{business} collects only what's needed to fill your order: your name, email, phone number and shipping address. Payments are handled by Stripe; we never see or store your card number.\n\nWe use your details to ship your order and contact you about it. If you sign up for updates, we email you about new items, and you can ask to be removed at any time.\n\nWe don't sell or share your information, except with the services that make the shop work (Stripe for payments, our web host, and shipping carriers).\n\nThe site uses one small cookie to count daily visitors. It contains no personal information.\n\nTo see, change or delete your information, email {email}.",
    terms:
      "By ordering from {business} you agree to these terms.\n\nPrices are in US dollars and can change at any time. Your order is confirmed when payment goes through, and you'll get a receipt by email.\n\nHandmade items vary a little from piece to piece, and that's part of their character. Photos are as accurate as we can make them.\n\nShipping times are estimates. Once a package is with the carrier, delivery is up to them, but we'll help sort out any problem.\n\nSee our shipping and returns policies for the rest. Questions: {email}.",
  },

  // Images
  // Upload images to storefront/public/images on GitHub and write "/images/name.png",
  // or upload them in the dashboard (Words & logos). "" uses the built-in badge / no photo.
  images: {
    logo: "", // header and footer; a PNG with a transparent background works best
    patch: "", // round emblem on the home page; uses the logo if ""
    tabIcon: "", // browser tab icon, square
    welcomePhoto: "", // big wide photo for the "showroom" layout
    aboutPhoto: "", // photo of the owner or workshop
  },

  // Look
  look: {
    theme: "military-police", // military-police | olive-drab | ocp-field | dress-blues | night-patrol | old-glory | brass-leather | clean-dispatch
    layout: "garrison", // garrison | field-manual | showroom | quartermaster
  },

  // Store
  store: {
    open: true, // false pauses ordering; the shop stays visible
    closedMessage: "The shop is on leave for a few days. Orders reopen soon.",
    askForShippingAddress: true, // false for pickup-only / digital items (no shipping charged)
    shippingPrice: 8, // flat shipping per order, in dollars
    freeShippingOver: 75, // orders this big ship free; 0 = never free
    shipToCountries: ["US", "CA"], // two-letter country codes
    lowStockAlert: 2, // phone alert when an item gets down to this many
    allowPromoCodes: true, // lets customers type a coupon code made in Stripe (Product catalog > Coupons)
    salesTaxByStripe: false, // true adds sales tax at checkout; turn on Stripe Tax first (Stripe > Settings > Tax)
    emailFrom: "", // sender for tracking emails, e.g. "Your Shop <orders@yourshop.com>"; needs a Resend key and verified domain
  },

  // ---------------------------------------------------- OWNER (not public)
  owner: {
    expenseCategories: ["Materials", "Tools", "Shipping supplies", "Postage", "Fees", "Marketing", "Software", "Other"],
    githubRepo: "", // e.g. "owner/repo"; adds a shortcut on the Settings page
    vercelProject: "", // e.g. "my-team/my-shop"
    links: [
      // shortcuts on the owner's Settings page
      // { label: "Shipping labels", url: "https://www.pirateship.com" },
    ],
  },

  // Products
  // One { ... } block per item. Copy a block to add an item.
  //   slug         unique web name, lowercase-with-dashes
  //   price        dollars;  wasPrice: a higher "was" price to show a sale, or null
  //   summary      one line on the shop page;  description: full text on the item's page
  //   category     items with the same category are grouped together
  //   stock        how many you have; null = unlimited
  //   madeToOrder  shows "Made to order"     featured: shows in the Featured row
  //   visible      false hides it without deleting it
  //   choice       one pick-list for customers, or null
  //   photos       leave out to keep photos added in the dashboard
  products: [
    {
      slug: "challenge-coin-display",
      name: "Challenge Coin Display",
      price: 65,
      wasPrice: null,
      summary: "Hardwood rack that holds 24 coins, finished by hand.",
      description:
        "Solid walnut with routed slots for 24 standard coins. Sanded to 320 grit and finished with three coats of oil.\n\nThis is a sample item. Change or delete it.",
      category: "Woodwork",
      stock: 5,
      madeToOrder: false,
      featured: true,
      visible: true,
      choice: { label: "Wood", options: ["Walnut", "Oak", "Cherry"] },
    },
    {
      slug: "flag-case",
      name: "Memorial Flag Case",
      price: 120,
      wasPrice: 140,
      summary: "Triangle case for a 5' x 9.5' burial flag.",
      description: "Glass-front triangle case with a hand-cut mitered frame. Engraving available on request.\n\nThis is a sample item.",
      category: "Woodwork",
      stock: null,
      madeToOrder: true,
      featured: true,
      visible: true,
      choice: null,
    },
    {
      slug: "leather-keychain",
      name: "Leather Keychain",
      price: 18,
      wasPrice: null,
      summary: "Stitched leather fob with a solid brass ring.",
      description: "Veg-tan leather, saddle stitched, edges burnished.\n\nThis is a sample item.",
      category: "Leather",
      stock: 20,
      madeToOrder: false,
      featured: false,
      visible: true,
      choice: { label: "Color", options: ["Natural", "Brown", "Black"] },
    },
  ],
} satisfies SiteVariables;

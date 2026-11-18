/*
 *  EDIT-POINT: SETUP-STEPS
 *  The step-by-step setup. Feeds both the Setup page in the dashboard (with
 *  live checkmarks) and SETUP.md on GitHub (regenerate: npm run guide).
 *  "check" names a field from lib/status.ts that turns the step green.
 */
import type { HelpBlock } from "./help";

export type SetupStep = {
  id: string;
  title: string;
  time: string;
  check?: "github" | "vercel" | "password" | "secret" | "database" | "photos" | "stripe" | "webhook" | "wallets" | "push" | "email" | "live";
  optional?: boolean;
  blocks: HelpBlock[];
  links?: { label: string; url: string }[];
};

/** Change this to wherever the shop's code lives on GitHub (the folder that has package.json). */
export const TEMPLATE_REPO = "https://github.com/real-cak3d/Torque-Timer/tree/main/storefront";

export const DEPLOY_URL =
  "https://vercel.com/new/clone?" +
  new URLSearchParams({
    "repository-url": TEMPLATE_REPO,
    "project-name": "shop",
    "repository-name": "shop",
    env: "ADMIN_PASSWORD,AUTH_SECRET",
    envDescription: "ADMIN_PASSWORD is your dashboard login. AUTH_SECRET is any long random text (mash the keyboard, 40+ characters).",
  }).toString();

export const SETUP_STEPS: SetupStep[] = [
  {
    id: "accounts",
    title: "Make your accounts",
    time: "10 min",
    check: "github",
    blocks: [
      { p: "You need three free accounts. Use the same email for all of them to keep things simple." },
      {
        steps: [
          "**GitHub** (stores the site's files): sign up at github.com.",
          "**Vercel** (runs the website): go to vercel.com, choose **Sign Up**, then **Continue with GitHub**. This links the two.",
          "**Stripe** (takes payments): sign up at stripe.com. You can explore in test mode right away; Stripe asks for business and bank details before real payments.",
        ],
      },
      { tip: "Supabase (the database) doesn't need its own sign-up. Vercel creates it for you in step 4." },
    ],
    links: [
      { label: "GitHub sign up", url: "https://github.com/signup" },
      { label: "Vercel sign up", url: "https://vercel.com/signup" },
      { label: "Stripe sign up", url: "https://dashboard.stripe.com/register" },
    ],
  },
  {
    id: "copy",
    title: "Get your own copy of the site",
    time: "5 min",
    check: "vercel",
    blocks: [
      { p: "**Easiest: the Deploy button.** It copies the shop into a new repository on your GitHub and puts it on Vercel at the same time." },
      {
        steps: [
          "Open the **Deploy to Vercel** link below while signed in to Vercel.",
          "Pick your GitHub account and keep the repository name (or choose your own). Leave it **Private** if you like.",
          "When it asks for **ADMIN_PASSWORD**, type the password you'll use for the dashboard.",
          "For **AUTH_SECRET**, type 40+ random characters (just mash the keyboard). You'll never need to remember it.",
          "Press **Deploy** and wait about two minutes. You'll get a web address like `shop-yourname.vercel.app`.",
        ],
      },
      { h: "Or: fork it by hand" },
      {
        steps: [
          "On GitHub, open the shop's repository and click **Fork**, then **Create fork**.",
          "In Vercel, click **Add New > Project**, find your fork and click **Import**.",
          "If the shop is inside a folder (like `storefront`), click **Edit** next to **Root Directory** and choose that folder.",
          "Open **Environment Variables** and add `ADMIN_PASSWORD` and `AUTH_SECRET` as described above, then click **Deploy**.",
        ],
      },
    ],
    links: [
      { label: "Deploy to Vercel", url: DEPLOY_URL },
      { label: "Vercel: import a project", url: "https://vercel.com/new" },
    ],
  },
  {
    id: "password",
    title: "Check your login",
    time: "1 min",
    check: "password",
    blocks: [
      { p: "Go to your new web address with `/admin` on the end and log in with your ADMIN_PASSWORD. You're in the dashboard you're reading now." },
      { p: "To change the password later, use **Settings > Password**." },
      { tip: "If AUTH_SECRET shows a warning below, add it in Vercel > your project > Settings > Environment Variables, then redeploy (Deployments > ⋯ > Redeploy)." },
    ],
  },
  {
    id: "supabase",
    title: "Connect Supabase (your database and photo storage)",
    time: "3 min",
    check: "database",
    blocks: [
      {
        steps: [
          "In Vercel, open your project and click the **Storage** tab.",
          "Click **Create Database**, choose **Supabase**, and follow the prompts (the free plan is plenty). Pick the region closest to you.",
          "When asked which project to connect, choose your shop and keep all environments ticked.",
          "Go to **Deployments**, click **⋯** on the newest one, then **Redeploy**.",
          "Come back to this page. The database and photo steps should turn green. The site creates its table and photo folder by itself on the first visit.",
        ],
      },
      { tip: "If the database step shows an error about the table, open Supabase (Vercel > Storage > your database > Open in Supabase), go to **SQL Editor**, paste the SQL shown under this step, and press **Run**." },
    ],
    links: [{ label: "Vercel dashboard", url: "https://vercel.com/dashboard" }],
  },
  {
    id: "stripe",
    title: "Connect Stripe",
    time: "3 min",
    check: "stripe",
    blocks: [
      {
        steps: [
          "In Stripe, make sure **Test mode** is on (top right) while you set up.",
          "Go to **Developers > API keys** and click **Reveal** next to **Secret key** (starts with `sk_test_`). Copy it.",
          "In this dashboard, open **Keys**, paste it into **Stripe secret key** and press **Save**. The site checks it with Stripe and pulls in any products you've made there.",
          "Still on **Keys**, press **Connect Stripe webhook**. This tells Stripe to send orders, refunds and product changes to your site instantly.",
        ],
      },
    ],
    links: [
      { label: "Stripe API keys", url: "https://dashboard.stripe.com/test/apikeys" },
      { label: "Open Keys", url: "/admin/keys" },
    ],
  },
  {
    id: "webhook",
    title: "Webhook connected",
    time: "1 click",
    check: "webhook",
    blocks: [{ p: "Done from **Keys > Connect Stripe webhook** (step above). If it's not green, press that button again from your live web address." }],
    links: [{ label: "Open Keys", url: "/admin/keys" }],
  },
  {
    id: "wallets",
    title: "Turn on Apple Pay and Google Pay",
    time: "2 min",
    check: "wallets",
    blocks: [
      {
        steps: [
          "In Stripe, go to **Settings > Payments > Payment methods**.",
          "Make sure **Cards**, **Apple Pay** and **Google Pay** are on. Link (Stripe's one-click checkout) is a nice extra.",
          "That's it. Stripe shows the Apple Pay button on iPhones and Macs with Safari, and Google Pay in Chrome and on Android.",
        ],
      },
      { tip: "No Apple developer account or domain verification is needed, because checkout happens on Stripe's own page." },
    ],
    links: [{ label: "Stripe payment methods", url: "https://dashboard.stripe.com/settings/payment_methods" }],
  },
  {
    id: "products",
    title: "Add products (here or in Stripe)",
    time: "as long as you like",
    blocks: [
      { p: "Either way works, and you can mix them:" },
      {
        list: [
          "**In this dashboard**: Products > **Add item**. Good for photos straight from your phone.",
          "**In Stripe**: Product catalog > **+ Add product**. Give it a name, description, photos and a **one-off** price. It appears in the shop within seconds.",
          "**In site-variables.ts on GitHub**: handy with ChatGPT. See Help > Editing with ChatGPT.",
        ],
      },
      { p: "Extra details for Stripe products go in the product's **Metadata** (bottom of the product page in Stripe): `category`, `stock`, `summary`, `featured` = true, `made_to_order` = true, `choice_label` = Color and `choice_options` = Black, Brown." },
    ],
    links: [
      { label: "Stripe: add a product", url: "https://dashboard.stripe.com/products/create" },
      { label: "Open Products", url: "/admin/products" },
    ],
  },
  {
    id: "coupons",
    title: "Coupons and promo codes",
    time: "2 min",
    optional: true,
    blocks: [
      {
        steps: [
          "In Stripe, go to **Product catalog > Coupons > + New**.",
          "Choose a percentage or amount off and how long it lasts.",
          "Under **Customer-facing codes**, add a code customers can type, like `VETERAN10`.",
          "Customers enter it on the checkout page. The **Discounts** page in this dashboard lists your codes and how often they've been used.",
        ],
      },
    ],
    links: [
      { label: "Stripe: new coupon", url: "https://dashboard.stripe.com/coupons/create" },
      { label: "Open Discounts", url: "/admin/discounts" },
    ],
  },
  {
    id: "receipts",
    title: "Turn on customer receipts",
    time: "1 min",
    blocks: [
      { p: "In Stripe, go to **Settings > Customer emails** and turn on **Successful payments**. Customers then get a receipt from Stripe with your business name." },
      { p: "While you're there, **Settings > Business > Public details** sets the name and support email shown on receipts and the checkout page, and **Branding** sets your logo and colors on the checkout page." },
    ],
    links: [
      { label: "Stripe customer emails", url: "https://dashboard.stripe.com/settings/emails" },
      { label: "Stripe branding", url: "https://dashboard.stripe.com/settings/branding" },
    ],
  },
  {
    id: "push",
    title: "Phone notifications",
    time: "3 min",
    check: "push",
    blocks: [
      {
        steps: [
          "On **Keys**, press **Create notification keys**.",
          "On your iPhone, open your site's `/admin` in Safari, tap **Share > Add to Home Screen**.",
          "Open **Shop HQ** from the home screen, go to **Settings**, tap **Turn on notifications**, then **Send a test**.",
        ],
      },
    ],
    links: [{ label: "Open Keys", url: "/admin/keys" }],
  },
  {
    id: "test-order",
    title: "Place a test order",
    time: "3 min",
    blocks: [
      {
        steps: [
          "Open your shop, add something to the cart and check out.",
          "Pay with card `4242 4242 4242 4242`, any future date, any 3-digit code and any ZIP.",
          "You should land on the thank-you page, see the order in **Orders**, and get a notification.",
        ],
      },
    ],
  },
  {
    id: "email",
    title: "Tracking emails",
    time: "10 min",
    optional: true,
    check: "email",
    blocks: [
      { p: "Lets you email customers their tracking number with one tap from an order." },
      {
        steps: [
          "Sign up at resend.com (free for small shops) and add your domain under **Domains** (needs a custom domain, below).",
          "Create an API key under **API Keys** and save it on the **Keys** page as **Resend API key**.",
          "In **Settings > Checkout & emails**, set the sender, e.g. `Your Shop <orders@yourshop.com>`.",
        ],
      },
      { tip: "Without this, the order page still has an email link that opens your own mail app with the tracking details filled in." },
    ],
    links: [{ label: "Resend", url: "https://resend.com/signup" }],
  },
  {
    id: "domain",
    title: "Your own web address",
    time: "10 min",
    optional: true,
    blocks: [
      {
        steps: [
          "Buy a domain (for example in Vercel > Domains, or any registrar).",
          "In Vercel, open your project > **Settings > Domains**, add it, and follow the instructions to point it at Vercel.",
          "After it works, open **Keys** and press **Connect Stripe webhook** again from the new address.",
        ],
      },
    ],
    links: [{ label: "Vercel domains", url: "https://vercel.com/domains" }],
  },
  {
    id: "tax",
    title: "Sales tax",
    time: "10 min",
    optional: true,
    blocks: [
      { p: "Stripe Tax works out and adds the right sales tax at checkout. Set it up in Stripe under **Settings > Tax** (add your address and where you're registered), then turn on **Sales tax by Stripe** in **Settings > Checkout & emails**." },
      { tip: "Rules depend on your state. A quick call with a tax preparer about selling online is worth it." },
    ],
    links: [{ label: "Stripe Tax", url: "https://dashboard.stripe.com/settings/tax" }],
  },
  {
    id: "live",
    title: "Go live",
    time: "15 min",
    check: "live",
    blocks: [
      {
        steps: [
          "In Stripe, finish **Activate payments** (business details and bank account).",
          "Switch off **Test mode**, go to **Developers > API keys** and copy the live **Secret key** (`sk_live_`).",
          "On **Keys**, press **Replace** on **Stripe secret key**, paste it and **Save**.",
          "Press **Connect Stripe webhook** again (live mode has its own webhooks).",
          "Products made in test mode don't carry over to live mode in Stripe. Re-create them in live mode, or keep them in the dashboard instead.",
          "Mark any test orders as **Cancelled** so they stay out of your totals, and share your link.",
        ],
      },
    ],
    links: [
      { label: "Stripe: activate", url: "https://dashboard.stripe.com/account/onboarding" },
      { label: "Open Keys", url: "/admin/keys" },
    ],
  },
];

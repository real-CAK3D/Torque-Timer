# Veteran-owned storefront + Shop HQ

An online shop with a private owner dashboard. Customers browse products and pay with card, **Apple Pay** or **Google Pay** through Stripe. The owner logs in at `/admin` (installable on an iPhone home screen) to manage products, photos, words, themes, orders, customers, income and expenses, and gets a phone notification for every new order.

Customers never see the dashboard. Nothing on the shop links to it, every `/admin` page and admin API requires the owner login, and the pages are marked `noindex`.

## What's inside

| Area | What it does |
|---|---|
| **Shop** (`/`) | 4 page layouts × 8 themes, product pages with photo galleries and choices (size/color), cart, Stripe checkout, thank-you page |
| **Dashboard** (`/admin`) | Sales, orders, profit, visitors, conversion, sales and visitor charts, best sellers, most viewed, traffic sources, setup checklist |
| **Orders** | Every paid order with items, address, payment method (Apple Pay / Google Pay / card), status (to ship → shipped → delivered) and private notes |
| **Products** | Add/edit/hide/delete items, upload up to 12 photos each (big phone photos are shrunk automatically), stock counts, made-to-order, featured, sale price |
| **Money** | Income vs. logged expenses, profit and margin, expenses by category |
| **Customers** | Everyone who ordered, how often and how much |
| **Words & logos** | Business name, headline, about story, service line, veteran badge, policies, contact, social links, logo / patch / tab icon / photos |
| **Look & layout** | Pick a theme and layout with a live preview before saving |
| **Settings** | Open/close the shop, shipping prices, low-stock alerts, phone notifications, links and status for Stripe, Apple Pay, Google Pay, GitHub, Vercel, storage, plus your own shortcut links |

**Themes:** Military Police (MP green & gold, black brassard band), Olive Drab, OCP Field, Dress Blues, Night Patrol (dark), Old Glory, Brass & Leather, Clean Dispatch.
**Layouts:** Garrison (classic), Field Manual (sidebar by category), Showroom (big photo + story rows), Quartermaster (compact catalog).

## Put it online (about 20 minutes)

### 1. Vercel project
1. Sign in at [vercel.com](https://vercel.com) with GitHub → **Add New → Project** → import this repository.
2. Set **Root Directory** to `storefront` (this folder). Framework is detected as Next.js.
3. Before deploying, add the environment variables from step 2.

### 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | The owner's login password |
| `AUTH_SECRET` | Any long random string (e.g. run `openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | From [Stripe → Developers → API keys](https://dashboard.stripe.com/apikeys). Use `sk_test_…` first, switch to `sk_live_…` when ready |
| `STRIPE_WEBHOOK_SECRET` | From step 4 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Run `npm run vapid` once and paste both lines |
| `VAPID_SUBJECT` | `mailto:` plus the owner's email |

### 3. Storage (Vercel → Project → Storage)
- **Upstash Redis** (from the Marketplace) → connect to the project. This saves products, orders, settings and analytics. It adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
- **Blob** → create a store and connect it. This holds uploaded logos and photos and adds `BLOB_READ_WRITE_TOKEN` automatically.

Redeploy after connecting storage so the new variables are picked up.

### 4. Stripe, Apple Pay and Google Pay
1. In Stripe go to **Developers → Webhooks → Add endpoint**: `https://YOUR-SITE/api/stripe/webhook`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `charge.refunded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy. (The exact address is shown with a Copy button in **Settings** inside the dashboard.)
2. In [Stripe → Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods), make sure **Apple Pay** and **Google Pay** are on. Checkout is hosted by Stripe, so no Apple domain verification is needed. The buttons appear automatically on supported devices.
3. Test with card `4242 4242 4242 4242`, any future date, any CVC. Then swap in live keys.

### 5. The owner's phone
1. On the iPhone, open `https://YOUR-SITE/admin` in Safari and log in.
2. Share → **Add to Home Screen**. It installs as **Shop HQ**.
3. Open it from the home screen → **Settings** → **Turn on notifications** → **Send a test**.

(iPhone needs iOS 16.4+ and the home-screen app for web notifications. New orders also show under the bell icon in the dashboard.)

### 6. Hand it over
Log in, open **Words & logos**, replace the placeholder name and story, upload the logo, then delete the three sample products and add real ones.

## Run it on your computer

```bash
cd storefront
npm install
npm run dev
```

Open http://localhost:3000 for the shop and http://localhost:3000/admin for the dashboard (password `changeme` locally unless `ADMIN_PASSWORD` is set). Without Redis/Blob configured, data is saved to `.data/db.json` and images to `public/uploads/`. Both are git-ignored.

## How it's built
- Next.js 15 (App Router) + TypeScript, no CSS framework. Themes are CSS variables in `lib/themes.ts`; add a theme by adding an entry there.
- `lib/store.ts`: Redis when configured, local JSON file otherwise.
- `lib/orders.ts`: turns a paid Stripe Checkout session into an order (idempotent; called by the webhook and the thank-you page), lowers stock and sends notifications.
- Prices are always taken from the server, never from the browser cart.
- `middleware.ts` protects `/admin/*` and `/api/admin/*` with a signed, HTTP-only login cookie (60 days, so the phone stays logged in).

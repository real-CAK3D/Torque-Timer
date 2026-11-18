# Veteran-owned storefront + Shop HQ

Setting it up for the first time? Start with [SETUP.md](SETUP.md).
Already running and want to know how something works? See [GUIDE.md](GUIDE.md). Both are also in the dashboard (Setup, and the ? button).

Online shop plus a private dashboard for running it. Customers pay with card, Apple Pay or Google Pay through Stripe. The owner logs in at `/admin` (it can be added to an iPhone home screen like an app) to handle products, photos, text, themes, orders, customers, money, messages, discounts and API keys, and gets a notification on his phone for each order.

Customers never see the dashboard. Nothing on the shop links to it, everything under `/admin` needs the owner's password, and search engines are told to skip it.

## The standard setup

| Service | Does | How it connects |
|---|---|---|
| **GitHub** | Holds the site's files, including `site-variables.ts` | The Deploy button copies the shop into your account |
| **Vercel** | Runs the website; rebuilds on every GitHub change | Linked to GitHub when you sign up with it |
| **Supabase** | Database and photo storage | Vercel > Storage > Supabase. The site creates its own table and photo bucket on first run |
| **Stripe** | Payments, Apple Pay, Google Pay, products, coupons, tax | Paste the secret key on the dashboard's **Keys** page, then one tap connects the webhook |

You only type two environment variables yourself (`ADMIN_PASSWORD` and `AUTH_SECRET`). Supabase adds its own. Other keys can be pasted on the dashboard's Keys page (stored encrypted) or set in Vercel if you'd rather; Vercel's win if both are set.

There's a Deploy to Vercel button in [SETUP.md, step 2](SETUP.md#copy).

## What's inside

| Area | What it does |
|---|---|
| **Shop** (`/`) | 4 page layouts × 8 themes, product pages with photo galleries and choices, cart, Stripe checkout with promo codes and optional sales tax, thank-you page, contact form, email sign-up, shipping / returns / privacy / terms pages, sitemap |
| **Dashboard** | Sales, orders, profit, visitors, conversion, charts, best sellers, most viewed, traffic sources, setup progress |
| **Orders** | Items, address, payment method, discounts and tax, status, carrier and tracking number, one-tap "shipped" email, private notes, spreadsheet download |
| **Products** | Add/edit/hide items with up to 12 photos, stock, choices, sale prices. Items made in Stripe sync in automatically |
| **Money** | Income vs. expenses, profit, margin, spreadsheets for taxes |
| **Customers** | Buyers, repeat customers, email sign-ups, downloads |
| **Inbox** | Messages from the shop's contact form |
| **Discounts** | Stripe coupons and promo codes, with usage |
| **Words & logos / Look & layout** | All text, logos, photos, policies; theme and layout with live preview |
| **Setup** | The setup steps with live checkmarks |
| **Keys** | Paste, test and replace API keys; create notification keys; connect the Stripe webhook; add keys for any other service |
| **Settings** | Store, shipping, checkout options, notifications, password, links to every account |
| **Help** | The full guide, searchable, opened from the **?** icon to the topic for the current page |

**Themes:** Military Police, Olive Drab, OCP Field, Dress Blues, Night Patrol (dark), Old Glory, Brass & Leather, Clean Dispatch.
**Layouts:** Garrison, Field Manual, Showroom, Quartermaster.

## Changing things later
- **Day to day:** the dashboard.
- **With ChatGPT:** all words, prices, products and settings are in **[`site-variables.ts`](site-variables.ts)**. Copy it into ChatGPT, ask for a change, paste the result back on GitHub and commit.
- **Code:** spots meant for editing are marked `EDIT-POINT` (`npm run edit-points`). See **[CUSTOMIZE.md](CUSTOMIZE.md)**.

## Run it on your computer

```bash
npm install
npm run dev
```

Open http://localhost:3000 (shop) and http://localhost:3000/admin (password `changeme` unless `ADMIN_PASSWORD` is set). Without Supabase connected, data is saved to `.data/db.json` and photos to `public/uploads/` (both git-ignored). Add Supabase and Stripe test keys to `.env.local` (see `.env.example`) to try the real thing.

After editing `lib/help.ts` or `lib/setup-steps.ts`, run `npm run guide` to refresh GUIDE.md and SETUP.md.

## How it's built
- Next.js 15 (App Router) + TypeScript, no CSS framework. Themes are CSS variables in `lib/themes.ts`.
- `lib/store.ts`: key/value storage on Supabase (`shop_kv` table), with Upstash Redis or a local file as fallbacks. `lib/supabase.ts` creates the table and photo bucket automatically.
- `lib/keys.ts`: API keys. Vercel environment variables first, then dashboard-saved keys (AES-256-GCM encrypted).
- `lib/stripe-catalog.ts`: turns Stripe products into shop items (webhook + manual sync). `lib/orders.ts`: turns paid Checkout sessions into orders (idempotent), stock, notifications.
- Prices are always taken from the server, never from the browser cart.
- `middleware.ts` protects `/admin/*` and `/api/admin/*` with a signed, HTTP-only login cookie (60 days).

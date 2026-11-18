# Shop guide

<!-- Generated from lib/help.ts by `npm run guide`. Edit that file, not this one. -->

Everything the site does and how to use it. The same guide is inside the dashboard: tap the **?** icon at the top of any page.

## Contents

**Start here**

- [How it all fits together](#overview): The shop customers see, the dashboard you run it from, and the services behind them.
- [Setting everything up](#setup): GitHub, Vercel, Supabase and Stripe, step by step.
- [Put the dashboard on your iPhone](#phone-app): Install it like an app and get a buzz for every order.
- [First-day checklist](#first-steps): Make the site yours before sharing the link.

**Dashboard pages**

- [Dashboard](#dashboard): Your sales, orders, profit and visitors at a glance.
- [Orders](#orders): Every paid order, where to ship it, and its status.
- [Products](#products): Add, edit, hide and price your items.
- [Money (income & expenses)](#money): What came in, what went out, and what you kept.
- [Customers](#customers): Who's buying, how often, and how much.
- [Words & logos](#words): Your name, story, contact info, logos and photos.
- [Look & layout](#look): Themes and page layouts, with a live preview.
- [Settings](#settings): Store options, checkout, notifications, password and your accounts.
- [Keys](#keys): Where API keys for Stripe and other services go.
- [Inbox](#inbox): Messages from your shop's contact form.
- [Discounts](#discounts): Coupons and promo codes, made in Stripe.
- [Notifications](#notifications): New orders, refunds and low stock.

**Editing on GitHub**

- [Editing with ChatGPT (site-variables.ts)](#site-variables): One file on GitHub with every word, price and product.
- [Code edit points](#edit-points): Labeled spots in the code for bigger changes.

**Payments & services**

- [Payments: Stripe, Apple Pay, Google Pay](#payments): How customers pay and how you get paid.
- [Selling items made in Stripe](#stripe-products): Make products in Stripe and they appear in the shop.
- [GitHub, Vercel and storage](#services): Where the site lives and where your data is kept.
- [What customers see](#customer-view): A walk through the shop from a customer's side.

**Troubleshooting**

- [Common problems](#faq): Quick fixes for things that go sideways.

## Start here

<a id="overview"></a>
### How it all fits together

_The shop customers see, the dashboard you run it from, and the services behind them._

Your site has two sides:

- **The shop** (your web address, e.g. `yourshop.com`). What customers see: your items, your story and the checkout.
- **The dashboard** (`yourshop.com/admin`). Only you can get in, with your password. Customers never see it and nothing on the shop links to it.

Behind the scenes, a few services do the heavy lifting:

- **Stripe** takes payments (card, Apple Pay, Google Pay) and sends the money to your bank.
- **GitHub** stores the site's files, including `site-variables.ts`, the one file with all your words, prices and products.
- **Vercel** runs the website. When something changes on GitHub, Vercel updates the live site in about a minute.
- **Supabase** (connected through Vercel) is the database. It saves your orders, products, settings, messages and visitor counts, and stores the photos and logos you upload.

API keys for Stripe and any other service go on the **Keys** page. The **Setup** page walks through connecting everything, with a checkmark as each step is done.

> **Tip:** You can change most things two ways: in the dashboard, or by editing `site-variables.ts` on GitHub (handy with ChatGPT). See **Editing with ChatGPT**.

<a id="setup"></a>
### Setting everything up

_GitHub, Vercel, Supabase and Stripe, step by step._

Open **Setup** in the menu. It lists every step in order (accounts, your own copy of the site, Supabase, Stripe, Apple Pay and Google Pay, notifications, going live) with exact clicks and links. Each step turns green on its own once it's done; refresh the page to re-check.

The same steps are in `SETUP.md` on GitHub, so you can follow along on another screen.

> **Tip:** The dashboard's **Finish setting up** box shows how many required steps are left and disappears when they're all done.

<a id="phone-app"></a>
### Put the dashboard on your iPhone

_Install it like an app and get a buzz for every order._

1. Open Safari and go to your site's address with `/admin` on the end. Log in.
2. Tap the **Share** button (square with an arrow), then **Add to Home Screen**, then **Add**.
3. Open the new **Shop HQ** icon from your home screen.
4. Go to **Settings** and tap **Turn on notifications**, then **Allow**.
5. Tap **Send a test** to make sure it works.

You stay logged in for 60 days. On Android, Chrome offers **Install app** from its menu, and notifications work the same way.

> **Tip:** iPhones only allow notifications from the home-screen app, not from a Safari tab, and need iOS 16.4 or newer.

<a id="first-steps"></a>
### First-day checklist

_Make the site yours before sharing the link._

1. **Words & logos**: set your business name, headline, about story and service line. Upload your logo.
2. **Products**: delete the three sample items and add your real ones with photos.
3. **Look & layout**: pick a theme and page layout.
4. **Setup**: work through anything not green yet, especially Stripe and Supabase.
5. **Settings**: check shipping prices and your checkout options.
6. Place a test order (see **Payments**) and watch it arrive in **Orders**.

## Dashboard pages

<a id="dashboard"></a>
### Dashboard

_Your sales, orders, profit and visitors at a glance._

Pick **7 days**, **30 days**, **90 days** or **1 yr** at the top to change the time period for everything on the page.

- **Sales**: money from paid orders (refunds left out).
- **Orders**: how many orders came in.
- **Profit after expenses**: sales minus the expenses you logged under **Money**.
- **Visitors**: people who opened the shop (each person counts once a day). The line under it shows how many visitors bought something.
- **Charts**: sales and visitors per day. Hover over or tap a bar to see its number. **Show as table** lists the numbers.
- **Best sellers**, **Most viewed** and **Where visitors came from** (e.g. facebook.com) help you see what's working.

Boxes under the totals flag things that need you: orders waiting to ship and items that are low or sold out. Tap one to go there.

> **Tip:** **Finish setting up** shows what's left to connect. Tap a line to jump to that step. It disappears once everything is done.

<a id="orders"></a>
### Orders

_Every paid order, where to ship it, and its status._

Orders show up here automatically when a customer pays. Tap one to open it.

- **Items**, **shipping cost** and how they paid (Apple Pay, Google Pay or card).
- **Ship to**: the customer's name and address. Tap their email or phone to contact them.
- **Status**: **To ship** → **Shipped** → **Delivered**. Mark **Refunded** or **Cancelled** if needed. Refunds made in Stripe update here on their own.
- **Private note**: tracking numbers, engraving text, anything to remember. Customers never see it. It saves when you tap outside the box.
- **Open in Stripe**: the payment in your Stripe account, where you can issue a refund.

#### Shipping an order

1. Buy and print the label wherever you like (Pirate Ship, USPS, UPS...).
2. Open the order, choose the **Carrier** and paste the **Tracking number**.
3. Tap **Mark shipped & email customer**. The customer gets an email with a tracking link. Without email set up, the button opens your own mail app with the message written for you.

The filter buttons at the top show only orders waiting to ship, shipped, or delivered. **Download spreadsheet** saves every order for your records or taxes. Discounts, promo codes and sales tax show on each order when used.

> **Tip:** Customers get their payment receipt from Stripe (turn it on in Stripe → Settings → Customer emails). Changing a status by itself doesn't email anyone; the ship button does.

<a id="products"></a>
### Products

_Add, edit, hide and price your items._

Tap **Add item**, or tap an existing item to edit it. The switch on the right of each item shows or hides it in the shop instantly.

#### Fields

- **Name** and **Price**. **Was price** is optional: fill it in higher than the price to show a sale.
- **Short description**: one line shown on the shop page. **Full description**: shown on the item's own page. Leave a blank line between paragraphs.
- **Category**: items with the same category are grouped together in some layouts.
- **Photos**: tap **Add photos**. Big phone photos are shrunk automatically. The first photo (gold outline) is the cover; use the arrows to reorder.
- **Stock**: how many you have. Leave it empty for unlimited. It goes down by itself when someone buys. **Made to order** shows that label instead.
- **Choices**: one pick-list for customers, like Color with Black, Brown, Natural.
- **Show in the shop** and **Feature at the top**.

#### Items from Stripe

Products you make in Stripe show up here on their own, marked **From Stripe**. Change their name, price, description and photos in Stripe. Stock, category, choices and featured can be set in either place. **Sync from Stripe** pulls everything again if something looks out of date. See **Selling items made in Stripe**.

> **Tip:** Hiding an item is safer than deleting it: you keep the details for later.

<a id="money"></a>
### Money (income & expenses)

_What came in, what went out, and what you kept._

**Income** is your paid, shipped and delivered orders. **Expenses** are what you log here. **Profit** and **Margin** are worked out for you.

1. Under **Log an expense**, pick the date, type what it was for, choose a category and enter the amount.
2. Tap **Add expense**. It shows in the totals and charts right away.

**Sales spreadsheet** and **Expenses spreadsheet** download everything for your tax preparer.

> **Tip:** Stripe keeps a small fee from each payment. It's listed in your Stripe dashboard. Log it here under **Fees** if you want it counted in profit. Keep receipts for taxes; this page is a helper, not an accountant.

<a id="customers"></a>
### Customers

_Who's buying, how often, and how much._

Everyone who has placed an order, with their total spent and last order date. **Came back for more** counts repeat customers. Tap an email to write to them.

**Email sign-ups** lists people who asked for updates from your shop's footer. **Download list** saves it for an email tool like Mailchimp or Kit. **Download spreadsheet** saves your customer list.

<a id="words"></a>
### Words & logos

_Your name, story, contact info, logos and photos._

- **Business**: name, tagline, and the thin **top banner** message (leave empty to hide it).
- **Welcome section**: the big headline and intro at the top of the home page, plus the headings above your items.
- **About**: your story and service line. **Show the veteran-owned badge** adds the star badge.
- **Policies**: shipping and returns, shown on item pages and in the footer.
- **Logos & photos**: main logo (header and footer), the round patch on the home page, the browser tab icon, the big welcome photo (used by the Showroom layout) and an about photo.
- **Contact** and **Social links**: anything left empty is hidden.

Tap **Save changes** at the bottom when you're done.

> **Tip:** A logo with a see-through background (PNG) looks best on every theme.

<a id="look"></a>
### Look & layout

_Themes and page layouts, with a live preview._

Tap a **theme** (colors and fonts) and a **page layout**. The preview at the bottom updates. Customers keep seeing the old look until you tap **Save changes**.

#### Themes

- **Military Police**: MP green and gold with a black armband-style header.
- **Olive Drab**, **OCP Field**: field greens and coyote browns.
- **Dress Blues**: Army blue and gold, formal lettering.
- **Night Patrol**: dark background.
- **Old Glory**: flag navy and red on white.
- **Brass & Leather**: warm workshop browns.
- **Clean Dispatch**: plain and modern, no military look.

#### Layouts

- **Garrison**: big welcome with your patch, featured items, then everything else.
- **Field Manual**: sidebar with your categories; items grouped by category.
- **Showroom**: full-width photo on top and large rows for each item. Upload a welcome photo for this one.
- **Quartermaster**: compact list with add-to-cart buttons. Best with lots of items.

<a id="settings"></a>
### Settings

_Store options, checkout, notifications, password and your accounts._

- **Store**: open or pause ordering (vacation, craft show), shipping price, free-shipping amount, countries you ship to, and the low-stock alert level.
- **Checkout & emails**: promo codes on or off, sales tax by Stripe, the contact form, the email sign-up box, and the address tracking emails come from.
- **Notifications on this device**: turn on order alerts for the phone or computer you're using.
- **Your accounts**: one-tap links to Stripe, Supabase, Vercel and GitHub.
- **My links**: your own shortcuts (shipping labels, suppliers, your bank).
- **Password**: change your dashboard password.

Tap **Save changes** at the bottom after changing anything. API keys are on the **Keys** page.

<a id="keys"></a>
### Keys

_Where API keys for Stripe and other services go._

An API key is a long password that lets the shop talk to another service. Paste it in, press **Save**, and the site checks it before storing it encrypted. Nobody, including you, can read a saved key back; you can only replace or remove it.

- **Stripe secret key**: connects payments. Saving it also pulls in your Stripe products.
- **Connect Stripe webhook**: one tap. Tells Stripe to send orders, refunds and product changes to your site instantly, and saves the webhook secret for you.
- **Create notification keys**: one tap. Needed for phone alerts.
- **Resend API key** (optional): lets the site email tracking numbers.
- **Add another key**: for any other service you start using later.

> **Tip:** A key that says **Set in Vercel** is an environment variable in Vercel; those always win. Change them in Vercel → Settings → Environment Variables.

<a id="inbox"></a>
### Inbox

_Messages from your shop's contact form._

When a customer fills in the contact form at the bottom of your shop, the message lands here and you get a notification. Tap one to read it, and **Reply** to answer from your own email.

Turn the form on or off in **Settings → Checkout & emails**.

<a id="discounts"></a>
### Discounts

_Coupons and promo codes, made in Stripe._

1. Tap **Make a coupon in Stripe**.
2. Choose a percent or amount off and how long it lasts.
3. Under **Customer-facing codes**, add the code customers will type, like `VETERAN10`. You can limit how many times it's used or when it expires.
4. Share the code. Customers type it on the checkout page.

This page lists your codes, how many times each was used, and the total discounted. Each order shows the code that was used.

<a id="notifications"></a>
### Notifications

_New orders, refunds and low stock._

The bell at the top shows a gold number when something new happens. Everything is listed here even if phone notifications are off. Tap one to jump to the order or item.

To get them on your phone, see **Put the dashboard on your iPhone**.

## Editing on GitHub

<a id="site-variables"></a>
### Editing with ChatGPT (site-variables.ts)

_One file on GitHub with every word, price and product._

The file `storefront/site-variables.ts` holds the business name, headlines, story, contact info, policies, theme, layout, shipping and every product. Each value has a note saying what it does, and the top of the file has instructions for ChatGPT.

1. On GitHub, open `storefront/site-variables.ts` and click the **Copy raw file** icon.
2. Paste it into ChatGPT and say what you want, e.g. "Add a walnut pen for $35, 10 in stock" or "Rewrite my about story".
3. Copy the whole file ChatGPT gives back.
4. On GitHub, click the **pencil** (Edit), select everything, paste, and click **Commit changes**.
5. Wait about a minute, then refresh your site.

#### How it works with the dashboard

- When the file changes, only the values that changed in it are applied. Everything else keeps what you set in the dashboard. Whichever was changed last wins.
- Removing a product from the file removes it from the shop. Use `visible: false` to hide it instead.
- Photos: upload them in the dashboard, or to `storefront/public/images` on GitHub and write `"/images/name.jpg"` in the file.

> **Tip:** If the file has a mistake, Vercel won't publish it and the current site stays up. Vercel emails you the error; paste it into ChatGPT for a fix, or open the commit on GitHub and click **Revert**.

<a id="edit-points"></a>
### Code edit points

_Labeled spots in the code for bigger changes._

For things the variables file can't do (new themes, menu links, checkout options), the code has labeled blocks that start with `EDIT-POINT:` and explain what to change. Search the repository on GitHub for `EDIT-POINT` to find them. `CUSTOMIZE.md` lists them all.

To get ChatGPT's help: copy the code under the label into ChatGPT, describe the change, and paste its answer back on GitHub the same way as the variables file.

> **Tip:** Passwords and keys never go in any file. They live in Vercel → Settings → Environment Variables.

## Payments & services

<a id="payments"></a>
### Payments: Stripe, Apple Pay, Google Pay

_How customers pay and how you get paid._

When a customer taps **Check out**, they go to Stripe's secure payment page. Card, **Apple Pay** and **Google Pay** appear there automatically on phones and browsers that support them. Prices always come from your site, so nobody can change them in their cart.

Stripe sends the money to your bank on a regular schedule (see **Payouts** in Stripe) and keeps a small fee per payment.

#### Test before going live

1. While your Stripe key starts with `sk_test`, payments are pretend. Settings shows **Test mode**.
2. Buy something using card `4242 4242 4242 4242`, any future date and any 3-digit code.
3. Check that the order shows in **Orders** and you got a notification.
4. When ready, follow **Setup → Go live**: paste your live key (`sk_live…`) on **Keys** and press **Connect Stripe webhook** again.

#### Promo codes and sales tax

Customers can type promo codes made in Stripe (see **Discounts**). If you turn on **Sales tax by Stripe** in Settings, Stripe adds the right tax at checkout. Set up Stripe Tax first in Stripe → Settings → Tax.

#### Refunds

Open the order, tap **Open in Stripe**, and refund it there. The order here switches to **Refunded** by itself.

<a id="stripe-products"></a>
### Selling items made in Stripe

_Make products in Stripe and they appear in the shop._

1. In Stripe, go to **Product catalog → + Add product**.
2. Fill in the name, description and photos. Under pricing choose **One-off** and enter the price.
3. Optional: at the bottom, under **Metadata**, add extra details (below).
4. Save. The item appears in your shop within seconds (or press **Sync from Stripe** on Products).

#### Metadata you can add in Stripe

- `category`: e.g. Woodwork
- `summary`: the one line shown on the shop page
- `stock`: how many you have; the shop counts down as they sell
- `was_price`: a higher old price to show a sale, e.g. 45
- `featured`: true
- `made_to_order`: true
- `choice_label` and `choice_options`: e.g. Color and Black, Brown, Natural

Archiving or deleting a product in Stripe hides it in the shop. Past orders keep their details.

> **Tip:** Test-mode products and live-mode products are separate in Stripe. When you go live, make your products again in live mode.

<a id="services"></a>
### GitHub, Vercel and storage

_Where the site lives and where your data is kept._

- **GitHub** holds the site's files. Every change there makes Vercel publish a new version.
- **Vercel** hosts the site. **Deployments** shows each version; you can roll back to an earlier one. **Settings → Environment Variables** holds your password and keys.
- **Supabase** (Vercel → Storage) is the database and photo storage. The site creates its own table and photo folder the first time it runs. Open it from Vercel → Storage if you ever want to look inside.

> **Tip:** Your owner password is the `ADMIN_PASSWORD` setting in Vercel. To change it, edit it there and redeploy.

<a id="customer-view"></a>
### What customers see

_A walk through the shop from a customer's side._

1. The home page shows your banner, headline, patch or logo, items, about story and contact info, arranged by your chosen layout.
2. Tapping an item opens its page: photos, price, description, the choice list and quantity, and **Add to cart**.
3. The cart shows the subtotal, shipping, and how much more is needed for free shipping.
4. **Check out** opens Stripe, where they enter shipping details and pay.
5. They land on a thank-you page with their order number, and Stripe emails a receipt.

Nothing on the shop links to the dashboard, and search engines are told not to list it.

## Troubleshooting

<a id="faq"></a>
### Common problems

_Quick fixes for things that go sideways._

#### I changed site-variables.ts but the site didn't change

Give it a minute, then refresh. In Vercel → Deployments, check that the newest one says **Ready**. If it says **Error**, the file has a mistake: open the error, paste it into ChatGPT with the file, and commit the fix. The old site stays up meanwhile.

#### A customer paid but there's no order

Orders usually appear when the customer reaches the thank-you page. If they closed the page early, the Stripe webhook delivers it. Check **Setup → Webhook connected** is green; if not, press **Connect Stripe webhook** on **Keys**.

#### Phone notifications don't arrive

On iPhone they only work from the home-screen app (iOS 16.4+). Open it, go to **Settings**, and tap **Send a test**. If notifications are blocked, allow them in iPhone Settings → Notifications → Shop HQ. New orders still show under the bell either way.

#### Photo upload fails

Check that the database step on **Setup** is green (Supabase connected). Use JPG, PNG or WebP photos.

#### My changes disappear after a while

The database step on **Setup** needs to be green. If it says it's saving to this computer only, connect Supabase in Vercel → Storage and redeploy.

#### A product I made in Stripe isn't showing

It needs a **one-off** price in US dollars and must not be archived. Press **Sync from Stripe** on Products. If you're in Stripe test mode, make sure the site is using your test key too (and the same for live).

#### A key says "Needs re-entering"

The secret that protects saved keys changed (usually AUTH_SECRET was added or edited in Vercel). Paste the key in again on **Keys**.

#### I forgot my password

If you never changed it in Settings: in Vercel → your project → Settings → Environment Variables, edit `ADMIN_PASSWORD`, then redeploy (Deployments → ⋯ → Redeploy). If you changed it in Settings, open Supabase (Vercel → Storage → Open in Supabase) → Table Editor → `shop_kv`, delete the row named `ownerPassword`, and the Vercel password works again.

#### Checkout says it isn't switched on

The Stripe key is missing. Paste it on the **Keys** page.

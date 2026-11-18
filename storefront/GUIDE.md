# Shop guide

<!-- Generated from lib/help.ts by `npm run guide`. Edit that file, not this one. -->

Everything the site does and how to use it. The same guide is inside the dashboard: tap the **?** icon at the top of any page.

## Contents

**Start here**

- [How it all fits together](#overview): The shop customers see, the dashboard you run it from, and the services behind them.
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
- [Settings](#settings): Store options, notifications, and links to every service.
- [Notifications](#notifications): New orders, refunds and low stock.

**Editing on GitHub**

- [Editing with ChatGPT (site-variables.ts)](#site-variables): One file on GitHub with every word, price and product.
- [Code edit points](#edit-points): Labeled spots in the code for bigger changes.

**Payments & services**

- [Payments: Stripe, Apple Pay, Google Pay](#payments): How customers pay and how you get paid.
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
- **Upstash Redis** (connected through Vercel) saves your orders, products, settings and visitor counts.
- **Vercel Blob** stores photos and logos you upload in the dashboard.

> **Tip:** You can change most things two ways: in the dashboard, or by editing `site-variables.ts` on GitHub (handy with ChatGPT). See **Editing with ChatGPT**.

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
4. **Settings**: check shipping prices, and work through anything the dashboard's **Finish setting up** box still lists.
5. Place a test order (see **Payments**) and watch it arrive in **Orders**.

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

> **Tip:** **Finish setting up** disappears once every service is connected.

<a id="orders"></a>
### Orders

_Every paid order, where to ship it, and its status._

Orders show up here automatically when a customer pays. Tap one to open it.

- **Items**, **shipping cost** and how they paid (Apple Pay, Google Pay or card).
- **Ship to**: the customer's name and address. Tap their email or phone to contact them.
- **Status**: **To ship** → **Shipped** → **Delivered**. Mark **Refunded** or **Cancelled** if needed. Refunds made in Stripe update here on their own.
- **Private note**: tracking numbers, engraving text, anything to remember. Customers never see it. It saves when you tap outside the box.
- **Open in Stripe**: the payment in your Stripe account, where you can issue a refund.

The filter buttons at the top show only orders waiting to ship, shipped, or delivered.

> **Tip:** Customers get their receipt by email from Stripe. Changing a status here doesn't email them, so send tracking numbers yourself.

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

> **Tip:** Hiding an item is safer than deleting it: you keep the details for later.

<a id="money"></a>
### Money (income & expenses)

_What came in, what went out, and what you kept._

**Income** is your paid, shipped and delivered orders. **Expenses** are what you log here. **Profit** and **Margin** are worked out for you.

1. Under **Log an expense**, pick the date, type what it was for, choose a category and enter the amount.
2. Tap **Add expense**. It shows in the totals and charts right away.

> **Tip:** Stripe keeps a small fee from each payment. It's listed in your Stripe dashboard. Log it here under **Fees** if you want it counted in profit. Keep receipts for taxes; this page is a helper, not an accountant.

<a id="customers"></a>
### Customers

_Who's buying, how often, and how much._

Everyone who has placed an order, with their total spent and last order date. **Came back for more** counts repeat customers. Tap an email to write to them.

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

_Store options, notifications, and links to every service._

- **Shop is open for orders**: turn off to pause ordering (vacation, craft show). The shop stays visible with your message.
- **Shipping**: flat price per order, free-shipping amount, and the countries you ship to (two-letter codes like US, CA).
- **Low-stock alert at**: you get a notification when an item gets down to this many.
- **Notifications on this device**: turn on order alerts for the phone or computer you're using.
- **Payments**, **Hosting & storage**: green dot means connected. Buttons open Stripe, Google Pay, Apple Pay info, GitHub and Vercel. The webhook address has a **Copy** button.
- **My links**: your own shortcuts (shipping labels, suppliers, your bank).
- **Log out**.

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
4. When ready, swap in your live key (`sk_live…`) and live webhook secret in Vercel, then redeploy.

#### Refunds

Open the order, tap **Open in Stripe**, and refund it there. The order here switches to **Refunded** by itself.

<a id="services"></a>
### GitHub, Vercel and storage

_Where the site lives and where your data is kept._

- **GitHub** holds the site's files. Every change there makes Vercel publish a new version.
- **Vercel** hosts the site. **Deployments** shows each version; you can roll back to an earlier one. **Settings → Environment Variables** holds your password and keys.
- **Upstash Redis** (Vercel → Storage) keeps orders, products, settings and analytics. Without it, changes don't stick.
- **Vercel Blob** (Vercel → Storage) keeps uploaded photos. Without it, uploads fail on the live site.

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

Orders usually appear when the customer reaches the thank-you page. If they closed the page early, the Stripe webhook delivers it. Check **Settings → Order webhook** is green, and in Stripe → Developers → Webhooks that the address matches your site.

#### Phone notifications don't arrive

On iPhone they only work from the home-screen app (iOS 16.4+). Open it, go to **Settings**, and tap **Send a test**. If notifications are blocked, allow them in iPhone Settings → Notifications → Shop HQ. New orders still show under the bell either way.

#### Photo upload fails

Make sure **Image storage** is green in Settings (Vercel Blob connected). Use JPG, PNG or WebP photos.

#### My changes disappear after a while

**Saved data** in Settings needs to say **Upstash Redis**. If it says **Temporary**, connect Upstash Redis in Vercel → Storage and redeploy.

#### I forgot my password

In Vercel → your project → Settings → Environment Variables, edit `ADMIN_PASSWORD`, then redeploy (Deployments → ⋯ → Redeploy).

#### Checkout says it isn't switched on

The Stripe key is missing. Add `STRIPE_SECRET_KEY` in Vercel's environment variables and redeploy.

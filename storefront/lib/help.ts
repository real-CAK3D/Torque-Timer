/*
 *  EDIT-POINT: HELP
 *  The owner's guide. This one file feeds both:
 *    - the Help page in the dashboard (the ? icon), and
 *    - GUIDE.md on GitHub (regenerate it with: npm run guide)
 *  "match" ties a topic to dashboard pages, so the ? icon opens the right one.
 *  Text supports **bold** and `code`.
 */

export type HelpBlock =
  | { p: string }
  | { list: string[] }
  | { steps: string[] }
  | { tip: string }
  | { h: string };

export type HelpTopic = { id: string; title: string; match?: string[]; summary: string; blocks: HelpBlock[] };
export type HelpGroup = { title: string; topics: HelpTopic[] };

export const HELP: HelpGroup[] = [
  {
    title: "Start here",
    topics: [
      {
        id: "overview",
        title: "How it all fits together",
        summary: "The shop customers see, the dashboard you run it from, and the services behind them.",
        blocks: [
          { p: "Your site has two sides:" },
          {
            list: [
              "**The shop** (your web address, e.g. `yourshop.com`). What customers see: your items, your story and the checkout.",
              "**The dashboard** (`yourshop.com/admin`). Only you can get in, with your password. Customers never see it and nothing on the shop links to it.",
            ],
          },
          { p: "It runs on a few outside services:" },
          {
            list: [
              "**Stripe** takes payments (card, Apple Pay, Google Pay) and sends the money to your bank.",
              "**GitHub** stores the site's files, including `site-variables.ts`, the one file with all your words, prices and products.",
              "**Vercel** runs the website. When something changes on GitHub, Vercel updates the live site in about a minute.",
              "**Supabase** (connected through Vercel) is the database. It saves your orders, products, settings, messages and visitor counts, and stores the photos and logos you upload.",
            ],
          },
          { p: "API keys for Stripe and any other service go on the **Keys** page. The **Setup** page walks through connecting everything, with a checkmark as each step is done." },
          { tip: "You can change most things two ways: in the dashboard, or by editing `site-variables.ts` on GitHub (handy with ChatGPT). See **Editing with ChatGPT**." },
        ],
      },
      {
        id: "setup",
        title: "Setting everything up",
        match: ["/admin/setup"],
        summary: "GitHub, Vercel, Supabase and Stripe, step by step.",
        blocks: [
          { p: "Open **Setup** in the menu. It lists every step in order (accounts, your own copy of the site, Supabase, Stripe, Apple Pay and Google Pay, notifications, going live) with exact clicks and links. Each step turns green on its own once it's done; refresh the page to re-check." },
          { p: "The same steps are in `SETUP.md` on GitHub, so you can follow along on another screen." },
          { tip: "The dashboard's **Finish setting up** box shows how many required steps are left and disappears when they're all done." },
        ],
      },
      {
        id: "phone-app",
        title: "Put the dashboard on your iPhone",
        match: ["/admin/more"],
        summary: "Install it like an app and get a buzz for every order.",
        blocks: [
          {
            steps: [
              "Open Safari and go to your site's address with `/admin` on the end. Log in.",
              "Tap the **Share** button (square with an arrow), then **Add to Home Screen**, then **Add**.",
              "Open the new **Shop HQ** icon from your home screen.",
              "Go to **Settings** and tap **Turn on notifications**, then **Allow**.",
              "Tap **Send a test** to make sure it works.",
            ],
          },
          { p: "You stay logged in for 60 days. On Android, Chrome offers **Install app** from its menu, and notifications work the same way." },
          { tip: "iPhones only allow notifications from the home-screen app, not from a Safari tab, and need iOS 16.4 or newer." },
        ],
      },
      {
        id: "first-steps",
        title: "First-day checklist",
        summary: "Make the site yours before sharing the link.",
        blocks: [
          {
            steps: [
              "**Words & logos**: set your business name, headline, about story and service line. Upload your logo.",
              "**Products**: delete the three sample items and add your real ones with photos.",
              "**Look & layout**: pick a theme and page layout.",
              "**Setup**: work through anything not green yet, especially Stripe and Supabase.",
              "**Settings**: check shipping prices and your checkout options.",
              "Place a test order (see **Payments**) and watch it arrive in **Orders**.",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Dashboard pages",
    topics: [
      {
        id: "dashboard",
        title: "Dashboard",
        match: ["/admin"],
        summary: "Sales, orders, profit and visitors.",
        blocks: [
          { p: "Pick **7 days**, **30 days**, **90 days** or **1 yr** at the top to change the time period for everything on the page." },
          {
            list: [
              "**Sales**: money from paid orders (refunds left out).",
              "**Orders**: how many orders came in.",
              "**Profit after expenses**: sales minus the expenses you logged under **Money**.",
              "**Visitors**: people who opened the shop (each person counts once a day). The line under it shows how many visitors bought something.",
              "**Charts**: sales and visitors per day. Hover over or tap a bar to see its number. **Show as table** lists the numbers.",
              "**Best sellers**, **Most viewed** and **Where visitors came from** (e.g. facebook.com) help you see what's working.",
            ],
          },
          { p: "Boxes under the totals flag things that need you: orders waiting to ship and items that are low or sold out. Tap one to go there." },
          { tip: "**Finish setting up** shows what's left to connect. Tap a line to jump to that step. It disappears once everything is done." },
        ],
      },
      {
        id: "orders",
        title: "Orders",
        match: ["/admin/orders"],
        summary: "Every paid order, where to ship it, and its status.",
        blocks: [
          { p: "Orders show up here automatically when a customer pays. Tap one to open it." },
          {
            list: [
              "**Items**, **shipping cost** and how they paid (Apple Pay, Google Pay or card).",
              "**Ship to**: the customer's name and address. Tap their email or phone to contact them.",
              "**Status**: **To ship**, then **Shipped**, then **Delivered**. Mark **Refunded** or **Cancelled** if needed. Refunds made in Stripe update here on their own.",
              "**Private note**: tracking numbers, engraving text, anything to remember. Customers never see it. It saves when you tap outside the box.",
              "**Open in Stripe**: the payment in your Stripe account, where you can issue a refund.",
            ],
          },
          { h: "Shipping an order" },
          {
            steps: [
              "Buy and print the label wherever you like (Pirate Ship, USPS, UPS...).",
              "Open the order, choose the **Carrier** and paste the **Tracking number**.",
              "Tap **Mark shipped & email customer**. The customer gets an email with a tracking link. Without email set up, the button opens your own mail app with the message written for you.",
            ],
          },
          { p: "The filter buttons at the top show only orders waiting to ship, shipped, or delivered. **Download spreadsheet** saves every order for your records or taxes. Discounts, promo codes and sales tax show on each order when used." },
          { tip: "Customers get their payment receipt from Stripe (turn it on in Stripe > Settings > Customer emails). Changing a status by itself doesn't email anyone; the ship button does." },
        ],
      },
      {
        id: "products",
        title: "Products",
        match: ["/admin/products"],
        summary: "Add, edit, hide and price your items.",
        blocks: [
          { p: "Tap **Add item**, or tap an existing item to edit it. The switch on the right of each item shows or hides it in the shop instantly." },
          { h: "Fields" },
          {
            list: [
              "**Name** and **Price**. **Was price** is optional: fill it in higher than the price to show a sale.",
              "**Short description**: one line shown on the shop page. **Full description**: shown on the item's own page. Leave a blank line between paragraphs.",
              "**Category**: items with the same category are grouped together in some layouts.",
              "**Photos**: tap **Add photos**. Big phone photos are shrunk automatically. The first photo (gold outline) is the cover; use the arrows to reorder.",
              "**Stock**: how many you have. Leave it empty for unlimited. It goes down by itself when someone buys. **Made to order** shows that label instead.",
              "**Choices**: one pick-list for customers, like Color with Black, Brown, Natural.",
              "**Show in the shop** and **Feature at the top**.",
            ],
          },
          { h: "Items from Stripe" },
          { p: "Products you make in Stripe show up here on their own, marked **From Stripe**. Change their name, price, description and photos in Stripe. Stock, category, choices and featured can be set in either place. **Sync from Stripe** pulls everything again if something looks out of date. See **Selling items made in Stripe**." },
          { tip: "Hiding an item is safer than deleting it: you keep the details for later." },
        ],
      },
      {
        id: "money",
        title: "Money (income & expenses)",
        match: ["/admin/money"],
        summary: "What came in, what went out, and what you kept.",
        blocks: [
          { p: "**Income** is your paid, shipped and delivered orders. **Expenses** are what you log here. **Profit** and **Margin** are worked out for you." },
          {
            steps: [
              "Under **Log an expense**, pick the date, type what it was for, choose a category and enter the amount.",
              "Tap **Add expense**. It shows in the totals and charts right away.",
            ],
          },
          { p: "**Sales spreadsheet** and **Expenses spreadsheet** download everything for your tax preparer." },
          { tip: "Stripe keeps a small fee from each payment. It's listed in your Stripe dashboard. Log it here under **Fees** if you want it counted in profit. Keep receipts for taxes; this page is a helper, not an accountant." },
        ],
      },
      {
        id: "customers",
        title: "Customers",
        match: ["/admin/customers"],
        summary: "Who's buying, how often, and how much.",
        blocks: [
          { p: "Everyone who has placed an order, with their total spent and last order date. **Came back for more** counts repeat customers. Tap an email to write to them." },
          { p: "**Email sign-ups** lists people who asked for updates from your shop's footer. **Download list** saves it for an email tool like Mailchimp or Kit. **Download spreadsheet** saves your customer list." },
        ],
      },
      {
        id: "words",
        title: "Words & logos",
        match: ["/admin/content"],
        summary: "Your name, story, contact info, logos and photos.",
        blocks: [
          {
            list: [
              "**Business**: name, tagline, and the thin **top banner** message (leave empty to hide it).",
              "**Welcome section**: the big headline and intro at the top of the home page, plus the headings above your items.",
              "**About**: your story and service line. **Show the veteran-owned badge** adds the star badge.",
              "**Policies**: shipping and returns, shown on item pages and in the footer.",
              "**Logos & photos**: main logo (header and footer), the round patch on the home page, the browser tab icon, the big welcome photo (used by the Showroom layout) and an about photo.",
              "**Contact** and **Social links**: anything left empty is hidden.",
            ],
          },
          { p: "Tap **Save changes** at the bottom when you're done." },
          { tip: "A logo with a see-through background (PNG) looks best on every theme." },
        ],
      },
      {
        id: "look",
        title: "Look & layout",
        match: ["/admin/appearance"],
        summary: "Themes and page layouts, with a live preview.",
        blocks: [
          { p: "Tap a **theme** (colors and fonts) and a **page layout**. The preview at the bottom updates. Customers keep seeing the old look until you tap **Save changes**." },
          { h: "Themes" },
          {
            list: [
              "**Military Police**: MP green and gold with a black armband-style header.",
              "**Olive Drab**, **OCP Field**: field greens and coyote browns.",
              "**Dress Blues**: Army blue and gold, formal lettering.",
              "**Night Patrol**: dark background.",
              "**Old Glory**: flag navy and red on white.",
              "**Brass & Leather**: warm workshop browns.",
              "**Clean Dispatch**: plain and modern, no military look.",
            ],
          },
          { h: "Layouts" },
          {
            list: [
              "**Garrison**: big welcome with your patch, featured items, then everything else.",
              "**Field Manual**: sidebar with your categories; items grouped by category.",
              "**Showroom**: full-width photo on top and large rows for each item. Upload a welcome photo for this one.",
              "**Quartermaster**: compact list with add-to-cart buttons. Best with lots of items.",
            ],
          },
        ],
      },
      {
        id: "settings",
        title: "Settings",
        match: ["/admin/settings"],
        summary: "Store options, checkout, notifications, password and your accounts.",
        blocks: [
          {
            list: [
              "**Store**: open or pause ordering (vacation, craft show), shipping price, free-shipping amount, countries you ship to, and the low-stock alert level.",
              "**Checkout & emails**: promo codes on or off, sales tax by Stripe, the contact form, the email sign-up box, and the address tracking emails come from.",
              "**Notifications on this device**: turn on order alerts for the phone or computer you're using.",
              "**Your accounts**: one-tap links to Stripe, Supabase, Vercel and GitHub.",
              "**My links**: your own shortcuts (shipping labels, suppliers, your bank).",
              "**Password**: change your dashboard password.",
            ],
          },
          { p: "Tap **Save changes** at the bottom after changing anything. API keys are on the **Keys** page." },
        ],
      },
      {
        id: "keys",
        title: "Keys",
        match: ["/admin/keys"],
        summary: "Where API keys for Stripe and other services go.",
        blocks: [
          { p: "An API key is a long password that lets the shop talk to another service. Paste it in, press **Save**, and the site checks it before storing it encrypted. Nobody, including you, can read a saved key back; you can only replace or remove it." },
          {
            list: [
              "**Stripe secret key**: connects payments. Saving it also pulls in your Stripe products.",
              "**Connect Stripe webhook**: one tap. Tells Stripe to send orders, refunds and product changes to your site instantly, and saves the webhook secret for you.",
              "**Create notification keys**: one tap. Needed for phone alerts.",
              "**Resend API key** (optional): lets the site email tracking numbers.",
              "**Add another key**: for any other service you start using later.",
            ],
          },
          { tip: "A key that says **Set in Vercel** is an environment variable in Vercel; those always win. Change them in Vercel > Settings > Environment Variables." },
        ],
      },
      {
        id: "inbox",
        title: "Inbox",
        match: ["/admin/inbox"],
        summary: "Messages from your shop's contact form.",
        blocks: [
          { p: "When a customer fills in the contact form at the bottom of your shop, the message lands here and you get a notification. Tap one to read it, and **Reply** to answer from your own email." },
          { p: "Turn the form on or off in **Settings > Checkout & emails**." },
        ],
      },
      {
        id: "discounts",
        title: "Discounts",
        match: ["/admin/discounts"],
        summary: "Coupons and promo codes, made in Stripe.",
        blocks: [
          {
            steps: [
              "Tap **Make a coupon in Stripe**.",
              "Choose a percent or amount off and how long it lasts.",
              "Under **Customer-facing codes**, add the code customers will type, like `VETERAN10`. You can limit how many times it's used or when it expires.",
              "Share the code. Customers type it on the checkout page.",
            ],
          },
          { p: "This page lists your codes, how many times each was used, and the total discounted. Each order shows the code that was used." },
        ],
      },
      {
        id: "notifications",
        title: "Notifications",
        match: ["/admin/notifications"],
        summary: "New orders, refunds and low stock.",
        blocks: [
          { p: "The bell at the top shows a gold number when something new happens. Everything is listed here even if phone notifications are off. Tap one to jump to the order or item." },
          { p: "To get them on your phone, see **Put the dashboard on your iPhone**." },
        ],
      },
    ],
  },
  {
    title: "Editing on GitHub",
    topics: [
      {
        id: "site-variables",
        title: "Editing with ChatGPT (site-variables.ts)",
        summary: "One file on GitHub with every word, price and product.",
        blocks: [
          { p: "The file `storefront/site-variables.ts` holds the business name, headlines, story, contact info, policies, theme, layout, shipping and every product. Each value has a note saying what it does, and the top of the file has instructions for ChatGPT." },
          {
            steps: [
              "On GitHub, open `storefront/site-variables.ts` and click the **Copy raw file** icon.",
              "Paste it into ChatGPT and say what you want, e.g. \"Add a walnut pen for $35, 10 in stock\" or \"Rewrite my about story\".",
              "Copy the whole file ChatGPT gives back.",
              "On GitHub, click the **pencil** (Edit), select everything, paste, and click **Commit changes**.",
              "Wait about a minute, then refresh your site.",
            ],
          },
          { h: "How it works with the dashboard" },
          {
            list: [
              "When the file changes, only the values that changed in it are applied. Everything else keeps what you set in the dashboard. Whichever was changed last wins.",
              "Removing a product from the file removes it from the shop. Use `visible: false` to hide it instead.",
              "Photos: upload them in the dashboard, or to `storefront/public/images` on GitHub and write `\"/images/name.jpg\"` in the file.",
            ],
          },
          { tip: "If the file has a mistake, Vercel won't publish it and the current site stays up. Vercel emails you the error; paste it into ChatGPT for a fix, or open the commit on GitHub and click **Revert**." },
        ],
      },
      {
        id: "edit-points",
        title: "Code edit points",
        summary: "Labeled spots in the code for bigger changes.",
        blocks: [
          { p: "For things the variables file can't do (new themes, menu links, checkout options), the code has labeled blocks that start with `EDIT-POINT:` and explain what to change. Search the repository on GitHub for `EDIT-POINT` to find them. `CUSTOMIZE.md` lists them all." },
          { p: "To get ChatGPT's help: copy the code under the label into ChatGPT, describe the change, and paste its answer back on GitHub the same way as the variables file." },
          { tip: "Passwords and keys never go in any file. They live in Vercel > Settings > Environment Variables." },
        ],
      },
    ],
  },
  {
    title: "Payments & services",
    topics: [
      {
        id: "payments",
        title: "Payments: Stripe, Apple Pay, Google Pay",
        summary: "How customers pay and how you get paid.",
        blocks: [
          { p: "When a customer taps **Check out**, they go to Stripe's secure payment page. Card, **Apple Pay** and **Google Pay** appear there automatically on phones and browsers that support them. Prices always come from your site, so nobody can change them in their cart." },
          { p: "Stripe sends the money to your bank on a regular schedule (see **Payouts** in Stripe) and keeps a small fee per payment." },
          { h: "Test before going live" },
          {
            steps: [
              "While your Stripe key starts with `sk_test`, payments are pretend. Settings shows **Test mode**.",
              "Buy something using card `4242 4242 4242 4242`, any future date and any 3-digit code.",
              "Check that the order shows in **Orders** and you got a notification.",
              "When ready, follow **Setup > Go live**: paste your live key (`sk_live…`) on **Keys** and press **Connect Stripe webhook** again.",
            ],
          },
          { h: "Promo codes and sales tax" },
          { p: "Customers can type promo codes made in Stripe (see **Discounts**). If you turn on **Sales tax by Stripe** in Settings, Stripe adds the right tax at checkout. Set up Stripe Tax first in Stripe > Settings > Tax." },
          { h: "Refunds" },
          { p: "Open the order, tap **Open in Stripe**, and refund it there. The order here switches to **Refunded** by itself." },
        ],
      },
      {
        id: "stripe-products",
        title: "Selling items made in Stripe",
        summary: "Make products in Stripe and they appear in the shop.",
        blocks: [
          {
            steps: [
              "In Stripe, go to **Product catalog > + Add product**.",
              "Fill in the name, description and photos. Under pricing choose **One-off** and enter the price.",
              "Optional: at the bottom, under **Metadata**, add extra details (below).",
              "Save. The item appears in your shop within seconds (or press **Sync from Stripe** on Products).",
            ],
          },
          { h: "Metadata you can add in Stripe" },
          {
            list: [
              "`category`: e.g. Woodwork",
              "`summary`: the one line shown on the shop page",
              "`stock`: how many you have; the shop counts down as they sell",
              "`was_price`: a higher old price to show a sale, e.g. 45",
              "`featured`: true",
              "`made_to_order`: true",
              "`choice_label` and `choice_options`: e.g. Color and Black, Brown, Natural",
            ],
          },
          { p: "Archiving or deleting a product in Stripe hides it in the shop. Past orders keep their details." },
          { tip: "Test-mode products and live-mode products are separate in Stripe. When you go live, make your products again in live mode." },
        ],
      },
      {
        id: "services",
        title: "GitHub, Vercel and storage",
        summary: "Where the site lives and where your data is kept.",
        blocks: [
          {
            list: [
              "**GitHub** holds the site's files. Every change there makes Vercel publish a new version.",
              "**Vercel** hosts the site. **Deployments** shows each version; you can roll back to an earlier one. **Settings > Environment Variables** holds your password and keys.",
              "**Supabase** (Vercel > Storage) is the database and photo storage. The site creates its own table and photo folder the first time it runs. Open it from Vercel > Storage if you ever want to look inside.",
            ],
          },
          { tip: "Your owner password is the `ADMIN_PASSWORD` setting in Vercel. To change it, edit it there and redeploy." },
        ],
      },
      {
        id: "customer-view",
        title: "What customers see",
        summary: "A walk through the shop from a customer's side.",
        blocks: [
          {
            steps: [
              "The home page shows your banner, headline, patch or logo, items, about story and contact info, arranged by your chosen layout.",
              "Tapping an item opens its page: photos, price, description, the choice list and quantity, and **Add to cart**.",
              "The cart shows the subtotal, shipping, and how much more is needed for free shipping.",
              "**Check out** opens Stripe, where they enter shipping details and pay.",
              "They land on a thank-you page with their order number, and Stripe emails a receipt.",
            ],
          },
          { p: "Nothing on the shop links to the dashboard, and search engines are told not to list it." },
        ],
      },
    ],
  },
  {
    title: "Troubleshooting",
    topics: [
      {
        id: "faq",
        title: "Common problems",
        summary: "Quick fixes for things that go sideways.",
        blocks: [
          { h: "I changed site-variables.ts but the site didn't change" },
          { p: "Give it a minute, then refresh. In Vercel > Deployments, check that the newest one says **Ready**. If it says **Error**, the file has a mistake: open the error, paste it into ChatGPT with the file, and commit the fix. The old site stays up meanwhile." },
          { h: "A customer paid but there's no order" },
          { p: "Orders usually appear when the customer reaches the thank-you page. If they closed the page early, the Stripe webhook delivers it. Check **Setup > Webhook connected** is green; if not, press **Connect Stripe webhook** on **Keys**." },
          { h: "Phone notifications don't arrive" },
          { p: "On iPhone they only work from the home-screen app (iOS 16.4+). Open it, go to **Settings**, and tap **Send a test**. If notifications are blocked, allow them in iPhone Settings > Notifications > Shop HQ. New orders still show under the bell either way." },
          { h: "Photo upload fails" },
          { p: "Check that the database step on **Setup** is green (Supabase connected). Use JPG, PNG or WebP photos." },
          { h: "My changes disappear after a while" },
          { p: "The database step on **Setup** needs to be green. If it says it's saving to this computer only, connect Supabase in Vercel > Storage and redeploy." },
          { h: "A product I made in Stripe isn't showing" },
          { p: "It needs a **one-off** price in US dollars and must not be archived. Press **Sync from Stripe** on Products. If you're in Stripe test mode, make sure the site is using your test key too (and the same for live)." },
          { h: "A key says \"Needs re-entering\"" },
          { p: "The secret that protects saved keys changed (usually AUTH_SECRET was added or edited in Vercel). Paste the key in again on **Keys**." },
          { h: "I forgot my password" },
          { p: "If you never changed it in Settings: in Vercel > your project > Settings > Environment Variables, edit `ADMIN_PASSWORD`, then redeploy (Deployments > ⋯ > Redeploy). If you changed it in Settings, open Supabase (Vercel > Storage > Open in Supabase) > Table Editor > `shop_kv`, delete the row named `ownerPassword`, and the Vercel password works again." },
          { h: "Checkout says it isn't switched on" },
          { p: "The Stripe key is missing. Paste it on the **Keys** page." },
        ],
      },
    ],
  },
];

export function topicForPath(path: string): string {
  let best: { id: string; len: number } | null = null;
  for (const t of HELP.flatMap((g) => g.topics)) {
    for (const m of t.match ?? []) {
      const hit = path === m || (m !== "/admin" && path.startsWith(m + "/"));
      if (hit && (!best || m.length > best.len)) best = { id: t.id, len: m.length };
    }
  }
  return best?.id ?? "overview";
}

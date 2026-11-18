/* ============================================================================
 *  EDIT-POINT: HELP
 *  The owner's guide. This one file feeds both:
 *    - the Help page in the dashboard (the ? icon), and
 *    - GUIDE.md on GitHub (regenerate it with: npm run guide)
 *  "match" ties a topic to dashboard pages, so the ? icon opens the right one.
 *  Text supports **bold** and `code`.
 * ========================================================================== */

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
          { p: "Behind the scenes, a few services do the heavy lifting:" },
          {
            list: [
              "**Stripe** takes payments (card, Apple Pay, Google Pay) and sends the money to your bank.",
              "**GitHub** stores the site's files, including `site-variables.ts`, the one file with all your words, prices and products.",
              "**Vercel** runs the website. When something changes on GitHub, Vercel updates the live site in about a minute.",
              "**Upstash Redis** (connected through Vercel) saves your orders, products, settings and visitor counts.",
              "**Vercel Blob** stores photos and logos you upload in the dashboard.",
            ],
          },
          { tip: "You can change most things two ways: in the dashboard, or by editing `site-variables.ts` on GitHub (handy with ChatGPT). See **Editing with ChatGPT**." },
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
              "**Settings**: check shipping prices, and work through anything the dashboard's **Finish setting up** box still lists.",
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
        summary: "Your sales, orders, profit and visitors at a glance.",
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
          { tip: "**Finish setting up** disappears once every service is connected." },
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
              "**Status**: **To ship** → **Shipped** → **Delivered**. Mark **Refunded** or **Cancelled** if needed. Refunds made in Stripe update here on their own.",
              "**Private note**: tracking numbers, engraving text, anything to remember. Customers never see it. It saves when you tap outside the box.",
              "**Open in Stripe**: the payment in your Stripe account, where you can issue a refund.",
            ],
          },
          { p: "The filter buttons at the top show only orders waiting to ship, shipped, or delivered." },
          { tip: "Customers get their receipt by email from Stripe. Changing a status here doesn't email them, so send tracking numbers yourself." },
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
        summary: "Store options, notifications, and links to every service.",
        blocks: [
          {
            list: [
              "**Shop is open for orders**: turn off to pause ordering (vacation, craft show). The shop stays visible with your message.",
              "**Shipping**: flat price per order, free-shipping amount, and the countries you ship to (two-letter codes like US, CA).",
              "**Low-stock alert at**: you get a notification when an item gets down to this many.",
              "**Notifications on this device**: turn on order alerts for the phone or computer you're using.",
              "**Payments**, **Hosting & storage**: green dot means connected. Buttons open Stripe, Google Pay, Apple Pay info, GitHub and Vercel. The webhook address has a **Copy** button.",
              "**My links**: your own shortcuts (shipping labels, suppliers, your bank).",
              "**Log out**.",
            ],
          },
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
          { tip: "Passwords and keys never go in any file. They live in Vercel → Settings → Environment Variables." },
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
              "When ready, swap in your live key (`sk_live…`) and live webhook secret in Vercel, then redeploy.",
            ],
          },
          { h: "Refunds" },
          { p: "Open the order, tap **Open in Stripe**, and refund it there. The order here switches to **Refunded** by itself." },
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
              "**Vercel** hosts the site. **Deployments** shows each version; you can roll back to an earlier one. **Settings → Environment Variables** holds your password and keys.",
              "**Upstash Redis** (Vercel → Storage) keeps orders, products, settings and analytics. Without it, changes don't stick.",
              "**Vercel Blob** (Vercel → Storage) keeps uploaded photos. Without it, uploads fail on the live site.",
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
          { p: "Give it a minute, then refresh. In Vercel → Deployments, check that the newest one says **Ready**. If it says **Error**, the file has a mistake: open the error, paste it into ChatGPT with the file, and commit the fix. The old site stays up meanwhile." },
          { h: "A customer paid but there's no order" },
          { p: "Orders usually appear when the customer reaches the thank-you page. If they closed the page early, the Stripe webhook delivers it. Check **Settings → Order webhook** is green, and in Stripe → Developers → Webhooks that the address matches your site." },
          { h: "Phone notifications don't arrive" },
          { p: "On iPhone they only work from the home-screen app (iOS 16.4+). Open it, go to **Settings**, and tap **Send a test**. If notifications are blocked, allow them in iPhone Settings → Notifications → Shop HQ. New orders still show under the bell either way." },
          { h: "Photo upload fails" },
          { p: "Make sure **Image storage** is green in Settings (Vercel Blob connected). Use JPG, PNG or WebP photos." },
          { h: "My changes disappear after a while" },
          { p: "**Saved data** in Settings needs to say **Upstash Redis**. If it says **Temporary**, connect Upstash Redis in Vercel → Storage and redeploy." },
          { h: "I forgot my password" },
          { p: "In Vercel → your project → Settings → Environment Variables, edit `ADMIN_PASSWORD`, then redeploy (Deployments → ⋯ → Redeploy)." },
          { h: "Checkout says it isn't switched on" },
          { p: "The Stripe key is missing. Add `STRIPE_SECRET_KEY` in Vercel's environment variables and redeploy." },
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

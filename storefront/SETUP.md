# Setting up the shop

<!-- Generated from lib/setup-steps.ts by `npm run guide`. Edit that file, not this one. -->

Getting the shop online, in order: GitHub, Vercel, Supabase, then Stripe (which also handles Apple Pay and Google Pay). Once you can log in (step 3), the dashboard has a Setup page with the same list that checks steps off as you finish them.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Freal-cak3d%2FTorque-Timer%2Ftree%2Fmain%2Fstorefront&project-name=shop&repository-name=shop&env=ADMIN_PASSWORD%2CAUTH_SECRET&envDescription=ADMIN_PASSWORD+is+your+dashboard+login.+AUTH_SECRET+is+any+long+random+text+%28mash+the+keyboard%2C+40%2B+characters%29.)

| | Step | Time |
|---|---|---|
| 1 | [Make your accounts](#accounts) | 10 min |
| 2 | [Get your own copy of the site](#copy) | 5 min |
| 3 | [Check your login](#password) | 1 min |
| 4 | [Connect Supabase (your database and photo storage)](#supabase) | 3 min |
| 5 | [Connect Stripe](#stripe) | 3 min |
| 6 | [Webhook connected](#webhook) | 1 click |
| 7 | [Turn on Apple Pay and Google Pay](#wallets) | 2 min |
| 8 | [Add products (here or in Stripe)](#products) | as long as you like |
| 9 | [Coupons and promo codes](#coupons) _(optional)_ | 2 min |
| 10 | [Turn on customer receipts](#receipts) | 1 min |
| 11 | [Phone notifications](#push) | 3 min |
| 12 | [Place a test order](#test-order) | 3 min |
| 13 | [Tracking emails](#email) _(optional)_ | 10 min |
| 14 | [Your own web address](#domain) _(optional)_ | 10 min |
| 15 | [Sales tax](#tax) _(optional)_ | 10 min |
| 16 | [Go live](#live) | 15 min |

<a id="accounts"></a>
## 1. Make your accounts

You need three free accounts. Use the same email for all of them to keep things simple.

1. **GitHub** (stores the site's files): sign up at github.com.
2. **Vercel** (runs the website): go to vercel.com, choose **Sign Up**, then **Continue with GitHub**. This links the two.
3. **Stripe** (takes payments): sign up at stripe.com. You can explore in test mode right away; Stripe asks for business and bank details before real payments.

> **Tip:** Supabase (the database) doesn't need its own sign-up. Vercel creates it for you in step 4.

Links: [GitHub sign up](https://github.com/signup), [Vercel sign up](https://vercel.com/signup), [Stripe sign up](https://dashboard.stripe.com/register)

<a id="copy"></a>
## 2. Get your own copy of the site

**Easiest: the Deploy button.** It copies the shop into a new repository on your GitHub and puts it on Vercel at the same time.

1. Open the **Deploy to Vercel** link below while signed in to Vercel.
2. Pick your GitHub account and keep the repository name (or choose your own). Leave it **Private** if you like.
3. When it asks for **ADMIN_PASSWORD**, type the password you'll use for the dashboard.
4. For **AUTH_SECRET**, type 40+ random characters (just mash the keyboard). You'll never need to remember it.
5. Press **Deploy** and wait about two minutes. You'll get a web address like `shop-yourname.vercel.app`.

#### Or: fork it by hand

1. On GitHub, open the shop's repository and click **Fork**, then **Create fork**.
2. In Vercel, click **Add New > Project**, find your fork and click **Import**.
3. If the shop is inside a folder (like `storefront`), click **Edit** next to **Root Directory** and choose that folder.
4. Open **Environment Variables** and add `ADMIN_PASSWORD` and `AUTH_SECRET` as described above, then click **Deploy**.

Links: [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Freal-cak3d%2FTorque-Timer%2Ftree%2Fmain%2Fstorefront&project-name=shop&repository-name=shop&env=ADMIN_PASSWORD%2CAUTH_SECRET&envDescription=ADMIN_PASSWORD+is+your+dashboard+login.+AUTH_SECRET+is+any+long+random+text+%28mash+the+keyboard%2C+40%2B+characters%29.), [Vercel: import a project](https://vercel.com/new)

<a id="password"></a>
## 3. Check your login

Go to your new web address with `/admin` on the end and log in with your ADMIN_PASSWORD. You're in the dashboard you're reading now.

To change the password later, use **Settings > Password**.

> **Tip:** If AUTH_SECRET shows a warning below, add it in Vercel > your project > Settings > Environment Variables, then redeploy (Deployments > ⋯ > Redeploy).

<a id="supabase"></a>
## 4. Connect Supabase (your database and photo storage)

1. In Vercel, open your project and click the **Storage** tab.
2. Click **Create Database**, choose **Supabase**, and follow the prompts (the free plan is plenty). Pick the region closest to you.
3. When asked which project to connect, choose your shop and keep all environments ticked.
4. Go to **Deployments**, click **⋯** on the newest one, then **Redeploy**.
5. Come back to this page. The database and photo steps should turn green. The site creates its table and photo folder by itself on the first visit.

> **Tip:** If the database step shows an error about the table, open Supabase (Vercel > Storage > your database > Open in Supabase), go to **SQL Editor**, paste the SQL shown under this step, and press **Run**.

Links: [Vercel dashboard](https://vercel.com/dashboard)

<a id="stripe"></a>
## 5. Connect Stripe

1. In Stripe, make sure **Test mode** is on (top right) while you set up.
2. Go to **Developers > API keys** and click **Reveal** next to **Secret key** (starts with `sk_test_`). Copy it.
3. In this dashboard, open **Keys**, paste it into **Stripe secret key** and press **Save**. The site checks it with Stripe and pulls in any products you've made there.
4. Still on **Keys**, press **Connect Stripe webhook**. This tells Stripe to send orders, refunds and product changes to your site instantly.

Links: [Stripe API keys](https://dashboard.stripe.com/test/apikeys), Open Keys (dashboard, `/admin/keys`)

<a id="webhook"></a>
## 6. Webhook connected

Done from **Keys > Connect Stripe webhook** (step above). If it's not green, press that button again from your live web address.

Links: Open Keys (dashboard, `/admin/keys`)

<a id="wallets"></a>
## 7. Turn on Apple Pay and Google Pay

1. In Stripe, go to **Settings > Payments > Payment methods**.
2. Make sure **Cards**, **Apple Pay** and **Google Pay** are on. Link (Stripe's one-click checkout) is a nice extra.
3. That's it. Stripe shows the Apple Pay button on iPhones and Macs with Safari, and Google Pay in Chrome and on Android.

> **Tip:** No Apple developer account or domain verification is needed, because checkout happens on Stripe's own page.

Links: [Stripe payment methods](https://dashboard.stripe.com/settings/payment_methods)

<a id="products"></a>
## 8. Add products (here or in Stripe)

Either way works, and you can mix them:

- **In this dashboard**: Products > **Add item**. Good for photos straight from your phone.
- **In Stripe**: Product catalog > **+ Add product**. Give it a name, description, photos and a **one-off** price. It appears in the shop within seconds.
- **In site-variables.ts on GitHub**: handy with ChatGPT. See Help > Editing with ChatGPT.

Extra details for Stripe products go in the product's **Metadata** (bottom of the product page in Stripe): `category`, `stock`, `summary`, `featured` = true, `made_to_order` = true, `choice_label` = Color and `choice_options` = Black, Brown.

Links: [Stripe: add a product](https://dashboard.stripe.com/products/create), Open Products (dashboard, `/admin/products`)

<a id="coupons"></a>
## 9. Coupons and promo codes (optional)

1. In Stripe, go to **Product catalog > Coupons > + New**.
2. Choose a percentage or amount off and how long it lasts.
3. Under **Customer-facing codes**, add a code customers can type, like `VETERAN10`.
4. Customers enter it on the checkout page. The **Discounts** page in this dashboard lists your codes and how often they've been used.

Links: [Stripe: new coupon](https://dashboard.stripe.com/coupons/create), Open Discounts (dashboard, `/admin/discounts`)

<a id="receipts"></a>
## 10. Turn on customer receipts

In Stripe, go to **Settings > Customer emails** and turn on **Successful payments**. Customers then get a receipt from Stripe with your business name.

While you're there, **Settings > Business > Public details** sets the name and support email shown on receipts and the checkout page, and **Branding** sets your logo and colors on the checkout page.

Links: [Stripe customer emails](https://dashboard.stripe.com/settings/emails), [Stripe branding](https://dashboard.stripe.com/settings/branding)

<a id="push"></a>
## 11. Phone notifications

1. On **Keys**, press **Create notification keys**.
2. On your iPhone, open your site's `/admin` in Safari, tap **Share > Add to Home Screen**.
3. Open **Shop HQ** from the home screen, go to **Settings**, tap **Turn on notifications**, then **Send a test**.

Links: Open Keys (dashboard, `/admin/keys`)

<a id="test-order"></a>
## 12. Place a test order

1. Open your shop, add something to the cart and check out.
2. Pay with card `4242 4242 4242 4242`, any future date, any 3-digit code and any ZIP.
3. You should land on the thank-you page, see the order in **Orders**, and get a notification.

<a id="email"></a>
## 13. Tracking emails (optional)

Lets you email customers their tracking number with one tap from an order.

1. Sign up at resend.com (free for small shops) and add your domain under **Domains** (needs a custom domain, below).
2. Create an API key under **API Keys** and save it on the **Keys** page as **Resend API key**.
3. In **Settings > Checkout & emails**, set the sender, e.g. `Your Shop <orders@yourshop.com>`.

> **Tip:** Without this, the order page still has an email link that opens your own mail app with the tracking details filled in.

Links: [Resend](https://resend.com/signup)

<a id="domain"></a>
## 14. Your own web address (optional)

1. Buy a domain (for example in Vercel > Domains, or any registrar).
2. In Vercel, open your project > **Settings > Domains**, add it, and follow the instructions to point it at Vercel.
3. After it works, open **Keys** and press **Connect Stripe webhook** again from the new address.

Links: [Vercel domains](https://vercel.com/domains)

<a id="tax"></a>
## 15. Sales tax (optional)

Stripe Tax works out and adds the right sales tax at checkout. Set it up in Stripe under **Settings > Tax** (add your address and where you're registered), then turn on **Sales tax by Stripe** in **Settings > Checkout & emails**.

> **Tip:** Rules depend on your state. A quick call with a tax preparer about selling online is worth it.

Links: [Stripe Tax](https://dashboard.stripe.com/settings/tax)

<a id="live"></a>
## 16. Go live

1. In Stripe, finish **Activate payments** (business details and bank account).
2. Switch off **Test mode**, go to **Developers > API keys** and copy the live **Secret key** (`sk_live_`).
3. On **Keys**, press **Replace** on **Stripe secret key**, paste it and **Save**.
4. Press **Connect Stripe webhook** again (live mode has its own webhooks).
5. Products made in test mode don't carry over to live mode in Stripe. Re-create them in live mode, or keep them in the dashboard instead.
6. Mark any test orders as **Cancelled** so they stay out of your totals, and share your link.

Links: [Stripe: activate](https://dashboard.stripe.com/account/onboarding), Open Keys (dashboard, `/admin/keys`)

# Customizing the shop

There are two ways to change things. Use the first one whenever you can.

## 1. No code: the ChatGPT helper (most changes)

In the dashboard, open **ChatGPT helper** (on a phone: **More → ChatGPT helper**).

1. **Copy for ChatGPT.** This copies a brief with the shop's current words, prices, items and the rules for replying. Paste it as the first message in a new ChatGPT chat.
2. **Ask for what you want** in plain words: "rewrite my about section", "add a walnut pen for $35", "15% off all leather", "switch to Dress Blues", "log $62 of oak boards".
3. **Paste ChatGPT's whole reply** into the box and press **Check changes**. You'll see every change as *old → new*. Nothing is saved yet.
4. Press **Apply**. If you don't like it, press **Undo last change**.

The same page has a **Site variables** list showing every setting ChatGPT can change and its current value.

What ChatGPT can change: business name, headline, about story, service line, policies, contact info, social links, theme, layout, open/closed, shipping prices, low-stock alert, shortcut links, products (add, edit, hide, delete, prices, sales, stock, choices) and expenses.

What it can't do: upload photos (do that under **Products** or **Words & logos**) or change the site's code.

### The reply format (for reference)

ChatGPT replies with this JSON. Money is in dollars. Items are matched by their `slug`.

```json
{
  "format": "shop-changes/v1",
  "summary": "Put leather items on sale and updated the tagline",
  "settings": { "tagline": "Built by an MP. Made to last." },
  "products": {
    "add":    [{ "name": "Walnut Pen", "price": 35, "category": "Woodwork", "stock": 10 }],
    "update": [{ "slug": "leather-keychain", "price": 15.3, "compareAtPrice": 18 }],
    "remove": ["flag-case"]
  },
  "expenses": { "add": [{ "date": "2026-11-18", "description": "Oak boards", "category": "Materials", "amount": 62.4 }] }
}
```

## 2. Code changes: EDIT-POINT markers

Places in the code that are meant to be edited have a labeled block like this:

```ts
/* ========================================================================
 * EDIT-POINT: SHIPPING-COUNTRIES
 * Countries you ship to, as two-letter codes ("US", "CA", "GB", ...).
 * ======================================================================== */
```

To find one, search the repository for `EDIT-POINT: NAME` (on GitHub: press `/` and type it), or run `npm run edit-points` in the `storefront` folder to list them all with file and line numbers.

| Edit point | File | What you change there |
|---|---|---|
| `THEMES` | `lib/themes.ts` | Add or change color/font themes |
| `LAYOUTS` | `lib/themes.ts` | List of home page layouts |
| `STOREFRONT-STYLES` | `app/shop.css` | Shape, spacing and sizes on the shop |
| `HOME-PAGE-SECTIONS` | `components/shop/Sections.tsx` | Fixed headings like "Get in touch" |
| `NAV-LINKS` | `components/shop/Header.tsx` | Menu links in the shop's top bar |
| `FOOTER` | `components/shop/Footer.tsx` | Small print at the bottom |
| `EMBLEM` | `components/shop/Emblem.tsx` | Built-in badge shown before a logo is uploaded |
| `SOCIAL-NETWORKS` | `components/shop/Social.tsx` | Which social sites can be linked |
| `CHECKOUT` | `app/api/checkout/route.ts` | Stripe checkout options |
| `SHIPPING-COUNTRIES` | `app/api/checkout/route.ts` | Countries you ship to |
| `DEFAULT-TEXT` | `lib/db.ts` | Starting words/settings for a fresh site |
| `SAMPLE-PRODUCTS` | `lib/db.ts` | Demo items on first run |
| `NOTIFICATION-TEXT` | `lib/orders.ts` | Wording of new-order phone alerts |
| `EXPENSE-CATEGORIES` | `components/admin/ExpenseManager.tsx` | Expense dropdown categories |
| `ADMIN-MENU` | `components/admin/AdminNav.tsx` | Owner dashboard menu |
| `APP-ICON` | `app/api/manifest/route.ts` | Home-screen app name and icon |
| `LOGIN` | `lib/auth.ts` | How long the owner stays logged in |
| `SITE-VARIABLES` | `lib/variables.ts` | What ChatGPT is allowed to change |
| `CHATGPT-FORMAT` | `lib/changes.ts` | The paste-in format and the brief |

### Getting ChatGPT to help with a code change

If ChatGPT says a request "needs a code change", it will name an edit point. Then:

1. Open that file on GitHub (in the `storefront` folder) and find the `EDIT-POINT` block.
2. Copy the code just below the block and paste it into ChatGPT: *"Here is the SHIPPING-COUNTRIES section. Change it to also ship to the UK. Give me the full replacement."*
3. On GitHub, click the pencil icon, swap in the new code, and click **Commit changes**.
4. Vercel rebuilds the site in about a minute. If something breaks, open the commit on GitHub and click **Revert**, or roll back in Vercel → Deployments.

Things that never go in the code: passwords and keys. Those live in Vercel → Settings → Environment Variables.

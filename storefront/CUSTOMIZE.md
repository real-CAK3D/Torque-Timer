# Customizing the shop

## 1. Words, prices, products and settings: `site-variables.ts`

Everything on the shop that isn't code lives in one file: **`storefront/site-variables.ts`**. It holds the business name, headlines, about story, contact info, social links, policies, logo/photo paths, theme, layout, shipping, store open/closed and the full product list. Every value has a note next to it saying what it does, and the top of the file has instructions written for ChatGPT.

### Changing it with ChatGPT

1. On GitHub, open `storefront/site-variables.ts` and click **Copy raw file** (the copy icon above the code).
2. Paste it into ChatGPT and say what you want:
   - "Add a walnut pen for $35, 10 in stock, in Woodwork. Write the descriptions."
   - "Rewrite my about story. I was an MP from 2006 to 2014."
   - "Put everything in Leather on sale for 15% off."
   - "Switch to the Dress Blues theme and the Showroom layout."
3. Copy the **whole file** ChatGPT gives back.
4. On GitHub, click the **pencil** (Edit this file), select everything, paste, and click **Commit changes**.
5. Vercel rebuilds the site. It's live in about a minute.

**If ChatGPT makes a mistake** (a missing comma, a theme name that doesn't exist), Vercel refuses to publish it and the current site stays up. Vercel emails the error. Paste that error into ChatGPT to get a fixed file, or open the commit on GitHub and click **Revert**.

### Photos

ChatGPT can't upload photos. Either:
- upload them in the dashboard (**Products** → the item → Add photos, or **Words & logos**), or
- on GitHub, open `storefront/public/images`, click **Add file → Upload files**, then refer to them in `site-variables.ts` as `"/images/file-name.jpg"` (for example `logo: "/images/logo.png"` or `photos: ["/images/pen-1.jpg"]`).

If a product has no `photos` line, the photos added in the dashboard are kept.

### The file and the dashboard together

Both can change the same things. When `site-variables.ts` changes, **only the values that changed in the file** are applied; everything else keeps what was set in the dashboard. So whichever was changed most recently wins.

- Removing a product from the file removes it from the shop. To hide one but keep it, set `visible: false`.
- Products added only in the dashboard aren't touched by the file.
- Orders, expenses and customers live only in the dashboard.

## 2. Code changes: EDIT-POINT markers

Places in the code meant to be edited are labeled like this:

```ts
/* ========================================================================
 * EDIT-POINT: THEMES
 * The color + font themes the owner picks under Look & layout.
 * ...
 * ======================================================================== */
```

Find one by searching the repository for `EDIT-POINT: NAME` (on GitHub press `/` and type it), or run `npm run edit-points` in the `storefront` folder for a list with file and line numbers.

| Edit point | File | What you change there |
|---|---|---|
| `SITE-VARIABLES` | `site-variables.ts` | All words, prices, products and settings (see above) |
| `THEMES` | `lib/themes.ts` | Add or change color/font themes |
| `LAYOUTS` | `lib/themes.ts` | List of home page layouts |
| `STOREFRONT-STYLES` | `app/shop.css` | Shape, spacing and sizes on the shop |
| `HOME-PAGE-SECTIONS` | `components/shop/Sections.tsx` | Layout of the About and Contact sections |
| `NAV-LINKS` | `components/shop/Header.tsx` | Menu links in the shop's top bar |
| `FOOTER` | `components/shop/Footer.tsx` | Small print at the bottom |
| `EMBLEM` | `components/shop/Emblem.tsx` | Built-in badge shown before a logo is uploaded |
| `SOCIAL-NETWORKS` | `components/shop/Social.tsx` | Which social sites can be linked |
| `CHECKOUT` | `app/api/checkout/route.ts` | Stripe checkout options |
| `NOTIFICATION-TEXT` | `lib/orders.ts` | Wording of new-order phone alerts |
| `ADMIN-MENU` | `components/admin/AdminNav.tsx` | Owner dashboard menu |
| `APP-ICON` | `app/api/manifest/route.ts` | Home-screen app name and icon |
| `LOGIN` | `lib/auth.ts` | How long the owner stays logged in |
| `HELP` | `lib/help.ts` | The Help page and GUIDE.md (run `npm run guide` after editing) |

### Getting ChatGPT to help with a code change

1. Open the file on GitHub and find the `EDIT-POINT` block.
2. Copy the code under it into ChatGPT: *"Here is the NAV-LINKS section of my site. Add a link called Custom Orders that goes to /#contact. Give me the full replacement."*
3. On GitHub, click the pencil, swap in the new code, and click **Commit changes**. Vercel rebuilds automatically.

Passwords and keys never go in any file. They live in Vercel → Settings → Environment Variables.

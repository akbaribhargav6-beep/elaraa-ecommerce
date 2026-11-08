# ELARAA → Shopify Theme Migration — Spec

**Date:** 2026-11-09
**Status:** Approved for planning (no build started)
**Owner:** Bhargav (ELARAA)

## Goal

Replace the current self-hosted stack (Next.js 15 storefront on Vercel + Express/Prisma/PostgreSQL API on Railway + custom admin panel) with a single installable Shopify Online Store 2.0 theme (`.zip`, uploadable via **Online Store → Themes → Add theme → Upload zip file**) that:

1. Looks and behaves **identically** to the live storefront at https://elaraaluxes.com on every public page (home, shop, product, cart, about, contact, policy, customer account pages).
2. Carries over the **exact live catalog**: 133 products in 6 categories (Necklaces 61, Earrings 25, Bracelets 18, Charms 14, Rings 10, Duo Set 5), 168 Cloudinary images, all prices and compare-at prices, stock, SKUs, and the featured / best-seller / new-arrival flags.
3. Drops the custom admin panel entirely. Shopify admin replaces it.
4. Keeps every storefront behaviour that Shopify can host (cart drawer, quick view, wishlist, search, filters, sort, pagination, WhatsApp bulk inquiry, share, pincode check, newsletter, contact form, notify-me, GSAP/Lenis motion, custom cursor).

## Source of truth

- **Design & behaviour:** `frontend/src/**` in this repo (Next.js). CSS tokens in `frontend/src/styles/globals.css` and `frontend/tailwind.config.ts`.
- **Catalog data:** the **production API** `https://api.elaraaluxes.com/api/products` and `/api/categories`, **not** `backend/prisma/seed.ts` (the seed has only 11 products).
- **Static assets:** `frontend/public/images/**`, `frontend/public/assets/images/hero/**`.
- **Store settings in use today:** gift packaging fee ₹99 (`/api/settings`), free-shipping threshold ₹2,000, GST 3 % shown as "Inclusive of all taxes", WhatsApp `+91 92134 73062`, email `customer@elaraaluxes.com`, Instagram `elaraa.luxes`, Facebook `elaraa.luxes`.

## Live data facts the migration must respect

| Fact | Value |
|---|---|
| Products / images | 133 / 168 (1–2 images each) |
| Variants | 1 metal label per product; 3 ring products have sizes 16 / 17 / 18 (9 sized variants). The public API omits inactive variants, so the 6 sold-out products arrive with no variant at all (price must come from `basePrice`, SKU is not exposed). |
| Metal label spellings | "Anti Tarnish", "Anti tarnish", "Anti Tarnish ", "AntiTarnish", "Anti-Tarnish", "Gold Plated" → normalise |
| Price range | ₹469 – ₹1,629; every product has a compare-at price |
| Out of stock | 6 products |
| Flags | 28 featured, 49 best sellers, 59 new arrivals |
| Product names | some have trailing whitespace → trim |
| SKUs | e.g. `BC-G-170`, `RG-G-246.1` (unique) |
| Slugs | unique, URL-safe → become Shopify handles unchanged |

## Platform decisions (locked)

| Area | Decision | Why |
|---|---|---|
| Theme type | Liquid Online Store 2.0 theme scaffolded from Shopify **Skeleton** theme | Only theme type installable from the admin. Hydrogen is a separate hosted app, rejected. |
| CSS | Tailwind compiled at build time into `assets/tailwind.css` + hand-ported `assets/elaraa.css`; no CDN Tailwind | Same utility classes as today, no runtime JIT. |
| Motion | GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.18 as theme assets (same versions as `frontend/package.json`) | 1:1 animation parity. |
| Fonts | Google Fonts `<link>`: Cormorant Garamond 300–600 (+italic), Jost 300–600, Caveat 500–700 | Same as `next/font` today. |
| Variant options | `Size` is the only Shopify option (when present). Metal finish → product metafields `custom.metal_finish` (text) and `custom.metal_hex` (text). Single-variant products use Shopify's `Title / Default Title`. | Live data has one metal per product; keeps variant table simple while the swatch UI stays. |
| Flags | Tags `featured`, `best-seller`, `new-arrival`, `category:<slug>` → automated collections `new-arrivals`, `best-sellers`, `featured`. Category collections = automated by `category:<slug>` tag. | Admin can toggle by editing tags. |
| Eyebrow / material | Metafields `custom.eyebrow`, `custom.material`; short description → `custom.short_description`; long description → product body HTML. | Mirrors `ProductDTO`. |
| Reviews | Judge.me (free plan) widget, restyled | Shopify has no native reviews. |
| Filters | Shopify **Search & Discovery** app (price, availability, Size) + collection links in the sidebar | Native storefront filtering. |
| Search | Shopify Predictive Search (`/search/suggest.json`) | Replaces `/api/products?search=`. |
| Wishlist | `localStorage` in the theme (no login required, no app) | Current wishlist requires login; Shopify has no native wishlist. Accepted change. |
| Notify me | Shopify `{% form 'contact' %}` with hidden product fields → store-owner email | No app; replaces the DB table + admin list. |
| Gift packaging | Hidden product "Gift Packaging" ₹99, added via Ajax Cart API from the cart page | Shows as a line item in Shopify checkout. |
| Coupons | Shopify Discount codes; cart page field redirects to `/discount/<CODE>?redirect=/cart` so the code is pre-applied at checkout | Shopify cannot validate codes on the cart page. |
| Checkout | Shopify Checkout with branding (logo, ivory/gold colours, fonts) | Not themeable below Plus. Accepted change. |
| Payments | Razorpay Secure app + Shopify manual payment "Cash on Delivery" | Shopify Payments unavailable in India. |
| Taxes | India GST 3 %, prices **tax-inclusive** | Matches "Inclusive of all taxes". |
| Customer accounts | **Classic** customer accounts (Liquid-themeable login/register/reset/orders/addresses) | New accounts are Shopify-hosted and cannot match the design. No email-verification step exists in Shopify. Accepted change. |
| Analytics | Facebook & Instagram sales channel (native Meta pixel) | Replaces `MetaPixel.tsx`. |
| Combo groups | Dropped (combo builder page already removed in git `1d36d53`); Duo Set stays an ordinary collection | No Shopify equivalent without Functions. |
| Invoices | Dropped; Shopify order confirmation/Order Printer if needed later | Admin feature. |
| URLs | Shopify redirects: `/product/<slug>`→`/products/<slug>`, `/shop`→`/collections/all`, `/about`→`/pages/about`, `/contact`→`/pages/contact`, `/policy`→`/pages/policy`, `/login`→`/account/login`, `/register`→`/account/register`. Query-string URLs (`/shop?category=…`) cannot be redirected by Shopify; nav links are rewritten to collection URLs. | SEO continuity. |

## Out of scope

- Hydrogen/Oxygen headless build.
- Migrating historical orders (optional later via Matrixify). Customers CSV export is a nice-to-have.
- Any new feature not on the live site today.
- Shopify Theme Store submission.

## Acceptance

- Side-by-side visual parity with elaraaluxes.com at 390 px, 768 px, 1440 px and 1700 px widths on every template.
- `shopify theme check` passes with no errors.
- Shopify admin shows 133 active products, 168 images, 6 category collections with the counts above, 3 flag collections.
- A COD test order and a Razorpay test-mode order both complete from the new theme.
- Theme zip installs on a fresh dev store with no manual file edits (only the admin configuration checklist in the plan).

# ELARAA Shopify Theme Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an installable Shopify Online Store 2.0 theme that reproduces elaraaluxes.com pixel-for-pixel, plus a one-shot migration that moves the 133 live products into Shopify.

**Architecture:** Two independent sub-projects under a new `shopify/` folder in this repo. `shopify/migration/` is a Node script set that pulls the live API and emits Shopify CSVs (products, redirects, customers). `shopify/theme/` is a Skeleton-based Liquid theme whose CSS is compiled from Tailwind + the ported `globals.css`, whose JS is small ES modules bundled by esbuild into `assets/`, and whose data comes only from Shopify objects (products, collections, metafields, cart) — no external API. Admin-side configuration (taxes, shipping, payments, apps, menus, redirects) is a written checklist executed once in the Shopify admin.

**Tech Stack:** Shopify CLI 3.x (`shopify theme init/dev/check/push/package`), Liquid, JSON templates, Tailwind CSS 3.4 CLI, esbuild, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.18, Node 20+ with `node --test`, Shopify Ajax Cart API, Predictive Search API, Product Recommendations API, Search & Discovery app, Judge.me, Razorpay Secure app.

**Spec:** `docs/superpowers/specs/2026-11-09-shopify-theme-migration-spec.md`

## Global Constraints

- Catalog source is `https://api.elaraaluxes.com` (paginated, `limit=48` works, `limit=100` returns HTTP 400). Never the Prisma seed.
- Product handle = live `slug`, unchanged. Product title = live `name`, trimmed.
- Metal label normalisation: any of `Anti Tarnish`, `Anti tarnish`, `Anti Tarnish ` (trailing space), `AntiTarnish`, `Anti-Tarnish` → `Anti Tarnish`; `Gold Plated` stays `Gold Plated`.
- Only `Size` becomes a Shopify option. Metal finish lives in metafields `custom.metal_finish` / `custom.metal_hex`.
- Tags: `category:<categorySlug>`, plus `featured`, `best-seller`, `new-arrival` when the flag is true.
- Prices are tax-inclusive INR; theme formats money as `₹1,234` (Indian grouping, no paise) — `formatPrice` in `frontend/src/lib/format.ts` is the reference.
- Design tokens (verbatim): `--ivory #F8F5F0`, `--cream #EFE9DE`, `--gold #C9A66B`, `--gold-deep #A8823D`, `--charcoal #2B2620`, `--black #17140F`. Fonts: Cormorant Garamond (serif/headings), Jost (body), Caveat (handwriting accents). Desktop header breakpoint `1600px` (`header-desktop`).
- Store constants exposed as theme settings with these defaults: free-shipping threshold `2000`, WhatsApp number `919213473062`, contact email `customer@elaraaluxes.com`, contact phone `+91 92134 73062`, Instagram `https://www.instagram.com/elaraa.luxes/`, Facebook `https://www.facebook.com/elaraa.luxes`.
- Every Liquid task ends with `shopify theme check` reporting 0 errors, and a visual check in `shopify theme dev` against the same page on https://elaraaluxes.com at 390 / 768 / 1440 / 1700 px.
- Section file names ≤ 25 characters (Shopify limit). JSON templates reference sections by file name.
- JS ships as plain `<script defer>` bundles; no framework, no runtime Tailwind.
- Commit after every task. Repo root is `elaraa-ecommerce/` (the folder containing `frontend/`, `backend/`, `shared/`).

## Review Focus

1. **Cloudinary image rows in the product CSV** — a product with 2 images needs a second CSV row with only `Handle`, `Image Src`, `Image Position` filled; a filled `Title` on that row makes Shopify create a duplicate product. Test in Task 2.
2. **Numeric size values** (`"16"`) — must stay strings in CSV and must never be opened/saved through Excel; the option value `16` with `Option1 Name = Size` must round-trip. Test in Task 2.
3. **Ajax add-to-cart failures** (sold out, qty > stock) — Shopify returns HTTP 422 with `{description}`; the drawer must show a toast, not silently do nothing. Test in Task 10.
4. **Free-shipping progress** at subtotal 0 and above the threshold — bar must clamp to 0–100 and the "₹X away" copy must not go negative. Test in Task 10.
5. **`localStorage` unavailable** (private mode / blocked) — wishlist must degrade to an in-memory list without throwing on page load. Test in Task 13.

---

## Phase 0 — Prerequisites (human, one-time)

- [ ] **Create the Shopify store** (trial is fine) at shopify.com/in. Store country India, currency INR. Note the `*.myshopify.com` domain.
- [ ] **Connect the Shopify connector** in this workspace (Settings → Connectors) so the Shopify MCP tools can create collections/discounts later. Today `get-shop-info` reports "requires authentication".
- [ ] **Install Shopify CLI** on the dev machine: `npm install -g @shopify/cli@latest`; verify with `shopify version`.
- [ ] **Decide shipping fee below ₹2,000.** The current value lives in the production `SiteSetting` table (key `shippingFee`); read it from the admin Settings page before Task 23.
- [ ] **Export existing coupon codes** from the current admin (Coupons page) into a list; they are recreated manually in Task 23.

---

## Phase 1 — Catalog migration tooling

### Task 1: Live catalog export script

**Files:**
- Create: `shopify/migration/package.json` (`"type": "module"`, scripts `fetch`, `build`, `test`)
- Create: `shopify/migration/src/fetch-live.mjs`
- Create: `shopify/migration/src/api.mjs`
- Create: `shopify/migration/.gitignore` (`out/`)
- Test: `shopify/migration/test/api.test.mjs`

**Interfaces:**
- Produces: `fetchAllProducts(baseUrl, fetchImpl) → Promise<ProductDTO[]>` and `fetchCategories(baseUrl, fetchImpl) → Promise<CategoryDTO[]>` in `api.mjs`. Types match `shared/src/types/index.ts` (`ProductDTO`, `CategoryDTO`). `fetch-live.mjs` writes `out/products.json` and `out/categories.json`.

- [ ] **Step 1: Write the failing test**

```js
// test/api.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllProducts } from '../src/api.mjs';

test('fetchAllProducts follows totalPages and unwraps {success,data}', async () => {
  const pages = {
    '/api/products?limit=48&page=1': { success: true, data: { items: [{ slug: 'a' }], page: 1, totalPages: 2 } },
    '/api/products?limit=48&page=2': { success: true, data: { items: [{ slug: 'b' }], page: 2, totalPages: 2 } },
  };
  const fakeFetch = async (url) => ({ ok: true, json: async () => pages[new URL(url).pathname + new URL(url).search] });
  const items = await fetchAllProducts('https://x.test', fakeFetch);
  assert.deepEqual(items.map((p) => p.slug), ['a', 'b']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd shopify/migration && node --test`
Expected: FAIL — cannot find module `../src/api.mjs`

- [ ] **Step 3: Implement `api.mjs`** with `fetchAllProducts` (loop `page` until `page >= totalPages`, `limit=48`) and `fetchCategories` (`GET /api/categories` → `data.categories`). Both throw on `!res.ok`.

- [ ] **Step 4: Implement `fetch-live.mjs`** — default `baseUrl = 'https://api.elaraaluxes.com'`, overridable by `ELARAA_API_URL`; writes the two JSON files under `out/` and prints `products: N, categories: M`.

- [ ] **Step 5: Run test and the real fetch**

Run: `node --test` → PASS. Run: `npm run fetch` → prints `products: 133, categories: 6`.

- [ ] **Step 6: Commit**

```bash
git add shopify/migration
git commit -m "feat(migration): export live ELARAA catalog to JSON"
```

### Task 2: Transform live products to Shopify product CSV

**Files:**
- Create: `shopify/migration/src/transform.mjs`
- Create: `shopify/migration/src/csv.mjs`
- Create: `shopify/migration/src/build-products-csv.mjs`
- Test: `shopify/migration/test/transform.test.mjs`

**Interfaces:**
- Consumes: `ProductDTO[]` from `out/products.json`.
- Produces: `normalizeMetal(label: string) → string`, `productTags(p: ProductDTO) → string[]`, `productToRows(p: ProductDTO) → Row[]` where `Row` is an object keyed by the exact Shopify CSV header names below; `toCsv(rows: Row[], headers: string[]) → string` (RFC 4180 quoting). `build-products-csv.mjs` writes `out/products.csv`.

CSV headers (exact, in this order): `Handle, Title, Body (HTML), Vendor, Type, Tags, Published, Option1 Name, Option1 Value, Variant SKU, Variant Inventory Tracker, Variant Inventory Qty, Variant Inventory Policy, Variant Fulfillment Service, Variant Price, Variant Compare At Price, Variant Requires Shipping, Variant Taxable, Image Src, Image Position, Image Alt Text, SEO Title, SEO Description, Status, Eyebrow (product.metafields.custom.eyebrow), Material (product.metafields.custom.material), Short Description (product.metafields.custom.short_description), Metal Finish (product.metafields.custom.metal_finish), Metal Hex (product.metafields.custom.metal_hex)`

Row rules:
- Row 1 per product carries everything; `Vendor = ELARAA`, `Type = <category name>`, `Published = TRUE`, `Status = active` if `isActive` else `draft`, `Variant Inventory Tracker = shopify`, `Variant Inventory Policy = deny`, `Variant Fulfillment Service = manual`, `Variant Requires Shipping = TRUE`, `Variant Taxable = TRUE`, `Body (HTML) = <p>{description}</p>`, `SEO Title = {name} | ELARAA`, `SEO Description = shortDescription`.
- If the product has any variant with a non-empty `size`: `Option1 Name = Size`, one row per variant (`Option1 Value = size`, that variant's SKU/qty/price). Otherwise one variant row with `Option1 Name = Title`, `Option1 Value = Default Title`.
- Images: first image on row 1 (`Image Position = 1`); each further image gets its own row with only `Handle`, `Image Src`, `Image Position`, `Image Alt Text` filled. Alt text = `altText ?? name`.
- Metafield columns only on row 1. `Metal Finish` = `normalizeMetal(variants[0].metalLabel)`, `Metal Hex` = `variants[0].metalHex ?? '#C9A66B'`.

- [ ] **Step 1: Write the failing tests**

```js
// test/transform.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMetal, productTags, productToRows } from '../src/transform.mjs';
import { toCsv } from '../src/csv.mjs';

const base = {
  name: 'Diamond X Pattern ', slug: 'diamond-x-pattern-16-17-18-size', categorySlug: 'rings', eyebrow: 'X PATTERN RING',
  shortDescription: 'short', description: 'long', material: 'Water Proof', basePrice: 939, compareAtPrice: 1139,
  isActive: true, isFeatured: false, isNewArrival: true, isBestSeller: false,
  images: [{ url: 'https://res.cloudinary.com/x/a.png', altText: null, sortOrder: 0 }, { url: 'https://res.cloudinary.com/x/b.png', altText: null, sortOrder: 1 }],
  variants: [
    { sku: 'RG-G-246', metalLabel: 'Anti tarnish', metalHex: '#C9A66B', backType: '', size: '16', price: 939, stockQuantity: 20 },
    { sku: 'RG-G-246.1', metalLabel: 'Anti tarnish', metalHex: '#C9A66B', backType: '', size: '17', price: 939, stockQuantity: 0 },
  ],
};

test('normalizeMetal collapses every live spelling', () => {
  for (const s of ['Anti Tarnish', 'Anti tarnish', 'Anti Tarnish ', 'AntiTarnish', 'Anti-Tarnish']) assert.equal(normalizeMetal(s), 'Anti Tarnish');
  assert.equal(normalizeMetal('Gold Plated'), 'Gold Plated');
});

test('productTags emits category and flag tags', () => {
  assert.deepEqual(productTags(base), ['category:rings', 'new-arrival']);
});

test('sized product → one row per size, title trimmed, size kept as string', () => {
  const rows = productToRows(base);
  assert.equal(rows[0].Title, 'Diamond X Pattern');
  assert.equal(rows[0]['Option1 Name'], 'Size');
  assert.equal(rows[0]['Option1 Value'], '16');
  assert.equal(rows[1]['Option1 Value'], '17');
  assert.equal(rows[1]['Variant Inventory Qty'], '0');
  assert.equal(rows[0]['Metal Finish (product.metafields.custom.metal_finish)'], 'Anti Tarnish');
});

test('extra images become handle-only rows', () => {
  const rows = productToRows(base);
  const imgRow = rows.find((r) => r['Image Position'] === '2');
  assert.equal(imgRow.Handle, base.slug);
  assert.equal(imgRow.Title, '');
  assert.equal(imgRow['Image Src'], 'https://res.cloudinary.com/x/b.png');
});

test('single-variant product uses Default Title', () => {
  const p = { ...base, variants: [{ ...base.variants[0], size: '' }], images: base.images.slice(0, 1) };
  const rows = productToRows(p);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]['Option1 Name'], 'Title');
  assert.equal(rows[0]['Option1 Value'], 'Default Title');
});

test('toCsv quotes commas and double quotes', () => {
  assert.equal(toCsv([{ A: 'x, "y"', B: '1' }], ['A', 'B']), 'A,B\n"x, ""y""",1');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test` → FAIL (module not found)

- [ ] **Step 3: Implement `transform.mjs` and `csv.mjs`** per the row rules. All cell values are strings.

- [ ] **Step 4: Implement `build-products-csv.mjs`** — reads `out/products.json`, writes `out/products.csv`, prints `rows: N, products: 133, images: 168`.

- [ ] **Step 5: Run tests and the build**

Run: `node --test` → all PASS. Run: `npm run build` → `products: 133, images: 168`.

- [ ] **Step 6: Commit**

```bash
git add shopify/migration
git commit -m "feat(migration): build Shopify product CSV from live catalog"
```

### Task 3: Redirects CSV and gift-packaging product row

**Files:**
- Create: `shopify/migration/src/build-redirects-csv.mjs`
- Create: `shopify/migration/src/redirects.mjs`
- Modify: `shopify/migration/src/build-products-csv.mjs` (append gift product)
- Test: `shopify/migration/test/redirects.test.mjs`

**Interfaces:**
- Produces: `redirectRows(products: {slug}[]) → {"Redirect from", "Redirect to"}[]`; `out/redirects.csv`. Gift product row: handle `gift-packaging`, title `Gift Packaging`, price `99`, tag `hidden`, `Published = TRUE`, no image, `Status = active`.

- [ ] **Step 1: Write the failing test**

```js
test('redirectRows covers products and static pages', () => {
  const rows = redirectRows([{ slug: 'captivate' }]);
  assert.deepEqual(rows[0], { 'Redirect from': '/product/captivate', 'Redirect to': '/products/captivate' });
  const from = rows.map((r) => r['Redirect from']);
  for (const p of ['/shop', '/about', '/contact', '/policy', '/login', '/register', '/forgot-password', '/account/orders', '/account/addresses', '/account/wishlist']) assert.ok(from.includes(p), p);
  assert.equal(rows.find((r) => r['Redirect from'] === '/shop')['Redirect to'], '/collections/all');
  assert.equal(rows.find((r) => r['Redirect from'] === '/account/wishlist')['Redirect to'], '/pages/wishlist');
});
```

Static map: `/about→/pages/about`, `/contact→/pages/contact`, `/policy→/pages/policy`, `/login→/account/login`, `/register→/account/register`, `/forgot-password→/account/login`, `/reset-password→/account/login`, `/verify-email→/account/login`, `/account/orders→/account`, `/account/wishlist→/pages/wishlist`. No row for `/shop` (reserved Shopify prefix, handled in Task 21's 404 template) and none for `/account/addresses` (same path on Shopify; a self-redirect is rejected).

- [ ] **Step 2: Run test → FAIL**
- [ ] **Step 3: Implement `redirects.mjs` + `build-redirects-csv.mjs`**, and append the gift product row in `build-products-csv.mjs`.
- [ ] **Step 4: Run `node --test` → PASS; `npm run build` → `products: 134`**
- [ ] **Step 5: Commit** — `feat(migration): redirects CSV and gift packaging product`

### Task 4: Import into Shopify and verify (human + tool-assisted)

**Files:** none in repo; outputs `out/products.csv`, `out/redirects.csv`.

- [ ] **Step 1: Import products** — Shopify admin → Products → Import → upload `out/products.csv` (untick "Overwrite products with matching handles" on first run). Wait for the import email.
- [ ] **Step 2: Verify counts** — Products list filtered by Status=Active shows 134 (133 + gift). Spot-check `diamond-x-pattern-16-17-18-size` has 3 variants, sizes 16/17/18, compare-at ₹1,139.
- [ ] **Step 3: Create collections** (admin or Shopify MCP `create-collection`): automated collections with condition *Product tag is equal to*: `earrings`, `rings`, `necklaces`, `bracelets`, `charms`, `duo-set` (tag `category:<slug>`, titles Earrings / Rings / Necklaces / Bracelets / Charms / Duo Set, images from `frontend/public/images/categories/*.webp` and the live Cloudinary category images), plus `new-arrivals` (tag `new-arrival`), `best-sellers` (tag `best-seller`), `featured` (tag `featured`). Expected counts: 25 / 10 / 61 / 18 / 14 / 5 and 59 / 49 / 28.
- [ ] **Step 4: Hide the gift product** — add it to no collection; in Search & Discovery (Task 23) exclude tag `hidden`.
- [ ] **Step 5: Import redirects** — Online Store → Navigation → URL redirects → Import `out/redirects.csv`.
- [ ] **Step 6: Record results** in `shopify/migration/IMPORT-LOG.md` (date, counts, any failed rows). Commit.

### Task 5 (optional): Customers CSV export from Postgres

**Files:**
- Create: `shopify/migration/src/export-customers.mjs` (uses `@prisma/client` from `backend/`)
- Produces: `out/customers.csv` with headers `First Name, Last Name, Email, Phone, Accepts Email Marketing, Default Address Address1, Default Address Address2, Default Address City, Default Address Province Code, Default Address Country Code, Default Address Zip, Tags`.

- [ ] **Step 1:** Implement against `User` + default `Address`; `Accepts Email Marketing = yes` only if the email exists in `NewsletterSubscriber` with `isActive`.
- [ ] **Step 2:** Run with production `DATABASE_URL` (read-only), import via Customers → Import. Customers receive no email; they set a password via the account-invite flow later.
- [ ] **Step 3: Commit**

---

## Phase 2 — Theme scaffold, tokens, build pipeline

### Task 6: Scaffold theme and build tooling

**Files:**
- Create: `shopify/theme/` via `shopify theme init theme` (Skeleton) run inside `shopify/`
- Create: `shopify/theme/package.json` (scripts `build:css`, `build:js`, `build`, `dev`, `test`, `check`)
- Create: `shopify/theme/tailwind.config.js`, `shopify/theme/src/css/tailwind.css`
- Create: `shopify/theme/esbuild.config.mjs`
- Create: `shopify/theme/.gitignore` (`node_modules/`, `assets/tailwind.css`, `assets/elaraa.js` are **committed** build outputs — do NOT ignore them; ignore only `node_modules/`)

**Interfaces:**
- Produces: `npm run build` → `assets/tailwind.css` (minified) and `assets/elaraa.js` (IIFE bundle from `src/js/index.mjs`). `npm run dev` → `shopify theme dev --store <store>`. `npm run check` → `shopify theme check`.

- [ ] **Step 1:** `cd shopify && shopify theme init theme` (accept Skeleton). Delete Skeleton's placeholder sections that will be replaced (`sections/*.liquid` except nothing we keep; keep `layout/theme.liquid` to overwrite in Task 8).
- [ ] **Step 2:** `tailwind.config.js` — port `frontend/tailwind.config.ts` verbatim (colors, fontFamily using CSS vars `--font-cormorant/--font-jost`, screens `header-desktop: 1600px`, keyframes `shimmer`/`marquee`, animations). `content: ['./layout/**/*.liquid','./sections/**/*.liquid','./snippets/**/*.liquid','./templates/**/*.json','./src/js/**/*.mjs']`.
- [ ] **Step 3:** `esbuild.config.mjs` — bundle `src/js/index.mjs` → `assets/elaraa.js`, format `iife`, target `es2019`, minify.
- [ ] **Step 4:** Verify: `npm run build` produces both assets; `npm run check` → 0 errors.
- [ ] **Step 5: Commit** — `chore(theme): scaffold Skeleton theme with Tailwind + esbuild pipeline`

### Task 7: Design tokens and component CSS

**Files:**
- Create: `shopify/theme/assets/elaraa.css` (hand-ported, not built)
- Create: `shopify/theme/assets/*.png|webp` — copy `frontend/public/images/logo/*`, `frontend/public/images/categories/*`, `frontend/public/assets/images/hero/*`

**Interfaces:**
- Produces: every class in `frontend/src/styles/globals.css` exists with the same name and rules: `.eyebrow`, `.gold-line`, `.btn-luxury` (+`::before`, `:hover`, `:disabled`), `.btn-gold`, `.btn-gold-solid`, `.nav-fixed`, `.nav-scrolled`, `nav a::after` underline, `.card-luxury`, `.card-cta`, `.divider-gold`, `.section-accent`, `.category-soon`, `.reveal`, `.fade-in`, `.marquee-track`, `.cursor-dot`, `.font-handwriting`, `.polaroid-card`, `.polaroid-tape`, `.gold-seal-stamp`, `.photo-gloss-overlay`, `.region-filter-btn`, `.qty-box`, `.step-num`, cart drawer classes, scrollbar styles. Font variables `--font-cormorant`, `--font-jost`, `--font-caveat` are set to the Google Fonts family names.

- [ ] **Step 1:** Copy `globals.css` lines after the three `@tailwind` directives into `assets/elaraa.css`; replace `var(--font-jost)` etc. definitions with `:root { --font-cormorant: 'Cormorant Garamond'; --font-jost: 'Jost'; --font-caveat: 'Caveat'; }`.
- [ ] **Step 2:** Copy image assets; file names flattened (`logo-elaraa-full.png`, `cat-ear.webp`, `hero-desktop.webp`, `hero-mobile.png`, …).
- [ ] **Step 3:** Verify with a temporary `templates/index.json` that renders `<button class="btn-luxury btn-gold"><span>Test</span></button>` — hover sweep animation matches live site.
- [ ] **Step 4: Commit** — `feat(theme): port ELARAA design tokens and component CSS`

### Task 8: `layout/theme.liquid`, motion runtime, theme settings

**Files:**
- Modify: `shopify/theme/layout/theme.liquid`
- Create: `shopify/theme/config/settings_schema.json`, `shopify/theme/config/settings_data.json`
- Create: `shopify/theme/assets/vendor-gsap.min.js`, `assets/vendor-scrolltrigger.min.js`, `assets/vendor-lenis.min.js` (copied from `node_modules/gsap@3.12.5/dist/*` and `lenis@1.1.18/dist/lenis.min.js`)
- Create: `shopify/theme/src/js/index.mjs`, `src/js/motion.mjs`, `src/js/money.mjs`
- Create: `shopify/theme/snippets/meta-tags.liquid`
- Test: `shopify/theme/test/money.test.mjs`

**Interfaces:**
- Produces: `formatPrice(cents: number) → string` in `money.mjs` (`123400 → '₹1,234'`, rounds, `en-IN` grouping). `initMotion()` in `motion.mjs`: Lenis (`duration 1.15`, easing `1.001 - 2^(-10t)`), GSAP ticker + `lagSmoothing(0)`, reveal of every `[data-reveal]` (`gsap.set opacity 0, y 32` → `to opacity 1, y 0, duration .9, ease 'power3.out', scrollTrigger start 'top 90%'`), `.cursor-dot` follow/grow/shrink on `a, button` hover for `min-width: 769px`, `.nav-scrolled` toggled on `.nav-fixed` when `scrollY > 60`. Global `window.ELARAA = { settings: {...}, formatPrice }` populated from Liquid.
- `settings_schema.json` groups: **Brand** (logo image, favicon), **Contact** (whatsapp_number, contact_email, contact_phone, instagram_url, facebook_url), **Commerce** (free_shipping_threshold number default 2000, gift_packaging_product product picker, pincode_success_copy), **Motion** (enable_smooth_scroll checkbox default true, enable_cursor checkbox default true).

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { formatPrice } from '../src/js/money.mjs';
test('formatPrice renders Indian grouping without paise', () => {
  assert.equal(formatPrice(123400), '₹1,234');
  assert.equal(formatPrice(9999999), '₹1,00,000');
  assert.equal(formatPrice(0), '₹0');
});
```

- [ ] **Step 2: Run → FAIL. Implement `money.mjs`. Run → PASS.**
- [ ] **Step 3: `theme.liquid`** — `<html lang="en">`, Google Fonts preconnect + stylesheet link for the three families/weights, `tailwind.css` **then** `elaraa.css` (component rules must follow the Tailwind layers exactly as in `globals.css`, or preflight/utilities win ties — placeholder colour, `.btn-luxury` padding), `{{ content_for_header }}`, `<body>` with `<div class="cursor-dot">`, `{% sections 'header-group' %}`, `{{ content_for_layout }}`, `{% sections 'footer-group' %}`, `{% render 'cart-drawer' %}` placeholder (filled in Task 10), `{% render 'quick-view' %}` placeholder (Task 12), inline `<script>window.ELARAA = {{ settings | json-ish }}</script>` exposing the Commerce/Contact settings and `cart.total_price`, then vendor scripts and `elaraa.js` with `defer`.
- [ ] **Step 4: `settings_schema.json`** as specified; `settings_data.json` with the defaults from Global Constraints.
- [ ] **Step 5: Verify** — `npm run build && npm run check` → 0 errors; `shopify theme dev` home shows ivory background, cursor dot follows mouse ≥ 769 px, body scroll is Lenis-smooth.
- [ ] **Step 6: Commit** — `feat(theme): layout, fonts, GSAP/Lenis runtime, theme settings`

---

## Phase 3 — Global chrome

### Task 9: Header section with predictive search and mobile drawer

**Files:**
- Create: `shopify/theme/sections/header.liquid` (schema: logo picker fallback to settings, menu picker `main_menu` default `main-menu`, menu picker `mobile_menu` default `mobile-menu`)
- Create: `shopify/theme/sections/header-group.json`
- Create: `shopify/theme/snippets/icon.liquid` (`name` param: `menu`, `close`, `search`, `bag`, `heart`, `whatsapp`, `share`, `instagram`, `facebook`, `shield`, `sparkle`)
- Create: `shopify/theme/src/js/header.mjs`, `src/js/search.mjs`
- Test: `shopify/theme/test/search.test.mjs`

**Interfaces:**
- Consumes: `window.ELARAA`, `.nav-fixed` toggling from `motion.mjs`.
- Produces: `buildSuggestUrl(q: string, limit = 6) → string` = `/search/suggest.json?q=<enc>&resources[type]=product&resources[limit]=<limit>&resources[options][unavailable_products]=last`; `initHeader()` wires hamburger drawer (`body` overflow lock, backdrop click closes), search popover (debounce 250 ms, renders title/price/image, Enter → `/search?q=`), bag button dispatches `elaraa:cart:open`. Bag badge element `[data-cart-count]` updated on `elaraa:cart:updated` (`9+` above 9).
- Markup mirrors `frontend/src/components/layout/Header.tsx`: desktop links hidden below `header-desktop`, logo absolutely centred, mobile `<aside>` with same footer copy ("Anti Tarnish Premium Fashion Jewellery" / "Free Insured Shipping Across India").

- [ ] **Step 1: Failing test** — `buildSuggestUrl('gold ring')` contains `q=gold%20ring` and `resources%5Btype%5D=product` or `resources[type]=product` (assert decoded form).
- [ ] **Step 2: Run → FAIL; implement `search.mjs`; run → PASS.**
- [ ] **Step 3: Build `header.liquid` + `header.mjs`**; menus come from Shopify navigation (Task 23 creates `main-menu`: Home, Shop → `/collections/all`, New Arrivals → `/collections/new-arrivals`, Best Seller → `/collections/best-sellers`, Our Story → `/pages/about`, Contact → `/pages/contact`; `mobile-menu` adds Customer Care → `/pages/policy`).
- [ ] **Step 4: Verify** — theme check 0 errors; at 1700 px links left / logo centre / icons right; at 1440 px hamburger shows (matches live). Search popover returns live products.
- [ ] **Step 5: Commit** — `feat(theme): header with predictive search and mobile drawer`

### Task 10: Cart drawer + Ajax cart store

**Files:**
- Create: `shopify/theme/snippets/cart-drawer.liquid`
- Create: `shopify/theme/src/js/cart.mjs`, `src/js/cart-drawer.mjs`
- Create: `shopify/theme/src/js/toast.mjs`
- Test: `shopify/theme/test/cart.test.mjs`

**Interfaces:**
- Produces (`cart.mjs`): `getCart() → Promise<Cart>` (`GET /cart.js`), `addItem(variantId, quantity) → Promise<Cart>` (`POST /cart/add.js` then `getCart()`), `changeLine(key, quantity) → Promise<Cart>` (`POST /cart/change.js`), `shippingProgress(subtotalCents, thresholdRupees) → { percent: number, remainingCents: number }`, `CartError` with `.description`. Every mutation dispatches `document.dispatchEvent(new CustomEvent('elaraa:cart:updated', { detail: cart }))`. `toast.mjs`: `notify(message: string)` renders a 3.5 s toast matching `toast-context.tsx`.
- Drawer: list items (image, title, variant title unless `Default Title`, qty box, remove), free-shipping progress bar + copy (`Add ₹X more for free insured shipping` / `You've unlocked free shipping`), subtotal, `Checkout →` (`/checkout`), `View Bag` (`/cart`), empty state `Your bag is empty.` Opens on `elaraa:cart:open` and after any successful add.

- [ ] **Step 1: Failing tests**

```js
test('shippingProgress clamps and never goes negative', () => {
  assert.deepEqual(shippingProgress(0, 2000), { percent: 0, remainingCents: 200000 });
  assert.deepEqual(shippingProgress(150000, 2000), { percent: 75, remainingCents: 50000 });
  assert.deepEqual(shippingProgress(999900, 2000), { percent: 100, remainingCents: 0 });
});
test('addItem surfaces Shopify 422 description as CartError', async () => {
  const fakeFetch = async () => ({ ok: false, status: 422, json: async () => ({ description: 'All 1 Captivate Studs are in your cart.' }) });
  await assert.rejects(addItem(1, 1, fakeFetch), (e) => e.name === 'CartError' && /Captivate/.test(e.description));
});
```

- [ ] **Step 2: Run → FAIL; implement `cart.mjs` (fetch injectable as last param); run → PASS.**
- [ ] **Step 3: Build `cart-drawer.liquid` + `cart-drawer.mjs` + `toast.mjs`**; on `CartError` call `notify(e.description)`; on network error `notify("Couldn't add this to your bag — please try again.")`.
- [ ] **Step 4: Verify** — add a product from `/products/captivate`; drawer slides in, badge increments, progress bar fills; set qty beyond stock → toast appears.
- [ ] **Step 5: Commit** — `feat(theme): Ajax cart store, drawer, toast`

### Task 11: Footer section

**Files:**
- Create: `shopify/theme/sections/footer.liquid` (schema: `blurb` richtext, menu pickers `collections_menu` default `footer-collections`, `support_menu` default `footer-support`, `secure_copy` text, checkboxes for payment badges)
- Create: `shopify/theme/sections/footer-group.json`

**Interfaces:** Four columns as `Footer.tsx`: brand (footer logo `logo-elaraa-footer.png`, blurb, "Connect With Us" with Instagram/Facebook/WhatsApp from settings), "Shop Collections" menu, "Customer Support" menu (Insured Shipping & Returns → `/pages/policy#shipping`, Anti Tarnish Quality Standard → `#authenticity`, Privacy Policy → `#privacy`, Terms of Service → `#terms`, Contact Concierge → `/pages/contact`), "Guaranteed & Secure" + "Accepted Payment Methods"; bottom bar `© {{ 'now' | date: '%Y' }} ELARAA LUXES. All rights reserved.`

- [ ] **Step 1: Build section + group JSON.**
- [ ] **Step 2: Verify** against live footer at 390 / 1440 px; theme check 0 errors.
- [ ] **Step 3: Commit** — `feat(theme): footer`

### Task 12: Product card snippet and Quick View modal

**Files:**
- Create: `shopify/theme/snippets/product-card.liquid` (params: `product`, `show_badge`)
- Create: `shopify/theme/snippets/quick-view.liquid`
- Create: `shopify/theme/src/js/quick-view.mjs`, `src/js/product-card.mjs`
- Test: `shopify/theme/test/quick-view.test.mjs`

**Interfaces:**
- Card mirrors `ProductCard.tsx`: `.card-luxury`, primary/secondary image cross-fade (`product.images[0]`, `[1]`), category badge (`product.type`), wishlist heart (`data-wishlist-handle`, Task 13), `Quick View` button (`data-quick-view="{{ product.handle }}"`), name, price + compare-at, `+ Bag` quick add → `addItem(product.selected_or_first_available_variant.id, 1)`; disabled when `product.available == false`.
- Quick View fetches `/products/<handle>.js`, renders image, eyebrow metafield (`product.metafields.custom.eyebrow` is not in the `.js` payload → read from `data-eyebrow` on the card), title, price, metal swatch from `data-metal-hex`, Size buttons from `options` when `options[0].name == 'Size'`, `Add to Bag`, `View Full Details →` → `/products/<handle>`.
- Produces: `selectVariant(productJson, { size }) → variant` in `quick-view.mjs` — returns the variant whose `option1 === size`, else first available, else `variants[0]`.

- [ ] **Step 1: Failing test** — `selectVariant({ options:[{name:'Size'}], variants:[{option1:'16',available:false},{option1:'17',available:true}] }, { size: '17' }).option1 === '17'`; with no size requested returns the `'17'` (first available).
- [ ] **Step 2: Run → FAIL; implement; run → PASS.**
- [ ] **Step 3: Build snippets + JS.**
- [ ] **Step 4: Verify** — hover cross-fade, Quick View opens with live data, `+ Bag` opens the drawer.
- [ ] **Step 5: Commit** — `feat(theme): product card and quick view`

### Task 13: Wishlist (localStorage) + wishlist page

**Files:**
- Create: `shopify/theme/src/js/wishlist.mjs`
- Create: `shopify/theme/sections/main-wishlist.liquid`, `templates/page.wishlist.json`
- Test: `shopify/theme/test/wishlist.test.mjs`

**Interfaces:**
- Produces: `createWishlist(storage?) → { has(handle), toggle(handle) → boolean, list() → string[] }` persisted under key `elaraa:wishlist` as a JSON array; when `storage` throws on access, falls back to an in-memory array. Dispatches `elaraa:wishlist:updated`. Hearts on cards/product page read `data-wishlist-handle`.
- Wishlist page renders `list()` by fetching `/products/<handle>.js` for each handle and reusing the card markup client-side; empty state copy from `account/wishlist/page.tsx`.

- [ ] **Step 1: Failing tests** — toggle adds then removes; persisted JSON equals `["captivate"]`; `createWishlist({ get getItem() { throw new Error('blocked'); } })` does not throw and `toggle('x')` returns `true`.
- [ ] **Step 2: Run → FAIL; implement; run → PASS.**
- [ ] **Step 3: Build page section + template**; Task 23 creates the page with handle `wishlist` and assigns template `page.wishlist`.
- [ ] **Step 4: Verify** in dev store; **Commit** — `feat(theme): localStorage wishlist and wishlist page`

---

## Phase 4 — Home page

### Task 14: Simple home sections

**Files:**
- Create: `sections/hero-banner.liquid` (desktop image 1920×900, mobile image 1080×1350, desktop/mobile copy blocks, CTA label+link; `<picture>` with `(min-width: 1024px)` source exactly as `HeroBanner.tsx`)
- Create: `sections/shop-categories.liquid` (blocks: collection picker → circular image + name; heading "Find Your Piece", eyebrow "Shop by Category"; link `/collections/<handle>`)
- Create: `sections/value-props.liquid` (4 text blocks, defaults Handcrafted Detail / Skin Friendly / Anti Tarnish / 14 Day Easy Returns)
- Create: `sections/brand-story.liquid` (black band, eyebrow, heading, paragraph, CTA → `/pages/about`)
- Create: `sections/faq.liquid` (blocks q/a; defaults = the 4 FAQ items in `app/page.tsx`)
- Create: `sections/newsletter.liquid` (`{% form 'customer' %}` with `contact[tags]=newsletter`, `contact[accepts_marketing]=true`; copy "Stay in the Light" / "Join the ELARAA Circle"; success message inline)
- Create: `templates/index.json` listing all home sections in live order: hero-banner, shop-categories, value-props, featured-collection, best-sellers, signature-earrings, brand-story, luxury-deal, necklace-chapters, new-arrivals, testimonials, elaraa-edit, faq, newsletter

Every section root carries `data-reveal` on the same elements that use `<RevealOnScroll>` today.

- [ ] **Step 1:** Build the six sections and `index.json` (product sections from Task 15/16 may 404 until then; keep their entries).
- [ ] **Step 2: Verify** — hero image swaps at 1024 px; newsletter form submit shows the Shopify success state; theme check 0 errors.
- [ ] **Step 3: Commit** — `feat(theme): hero, categories, value props, brand story, FAQ, newsletter`

### Task 15: Product-driven home sections

**Files:**
- Create: `sections/featured-collection.liquid` (collection picker default `featured`, limit 3, grid `md:grid-cols-3`, heading "Timeless Essentials")
- Create: `sections/best-sellers.liquid` (collection default `best-sellers`, limit 4, layout from `BestSellersShowcase.tsx`: 12-col grid, large card + 3 stacked, `+ Bag` on each)
- Create: `sections/signature-earrings.liquid` (collection default `earrings`, limit 4, staggered cards `lg:translate-y-8` on odd, CTA "View Full Earrings Collection →" → `/collections/earrings`)
- Create: `sections/luxury-deal.liquid` (product picker; falls back to first `featured` product with compare-at; decorative countdown HH:MM:SS looping — port `useDecorativeCountdown` into `src/js/countdown.mjs`)
- Create: `sections/necklace-chapters.liquid` (collection default `necklaces`, limit 4, alternating image/text rows labelled Chapter 01–04, CTA → `/collections/necklaces`)
- Create: `sections/new-arrivals.liquid` (collection default `new-arrivals`, limit 6, spotlight stage: click a thumbnail → feature it; `src/js/spotlight.mjs`)
- Test: `test/countdown.test.mjs` — `countdownParts(remainingSeconds) → {hours,mins,secs}` zero-pads (`3661 → {'01','01','01'}`).

- [ ] **Step 1: Failing test → implement `countdown.mjs` → PASS.**
- [ ] **Step 2: Build the six sections**; all quick-add buttons go through `cart.mjs`.
- [ ] **Step 3: Verify** against live home at 1440 px and 390 px; section order and copy match.
- [ ] **Step 4: Commit** — `feat(theme): product-driven home sections`

### Task 16: Testimonials polaroid gallery and ELARAA Edit grid

**Files:**
- Create: `sections/testimonials.liquid` (blocks: name, region select north/south/east/west, region_label, quote, doodle, rotation range −4..4, offset_y range −14..14, product picker; defaults = the 8 entries in `TestimonialsGallery.tsx`; region filter buttons with counts; lightbox)
- Create: `sections/elaraa-edit.liquid` (collection default `all`, 5 products' first images, 5th hidden below `md`)
- Create: `src/js/testimonials.mjs` (region filter, lightbox with Esc/arrows)

- [ ] **Step 1: Build both sections + JS.**
- [ ] **Step 2: Verify** — polaroid rotation/tape/gloss classes render; filter counts update; lightbox shows quote + "Wearing" product link.
- [ ] **Step 3: Commit** — `feat(theme): testimonials gallery and edit grid`

---

## Phase 5 — Collection (shop) and search

### Task 17: Collection template with filters, sort, pagination

**Files:**
- Create: `sections/main-collection.liquid`, `templates/collection.json`, `templates/search.json`, `sections/main-search.liquid`
- Create: `src/js/collection.mjs`

**Interfaces:**
- Header copy: eyebrow "The Full Edit", H1 = `collection.title` (`/collections/all` title set to "Shop All Jewellery" in admin), subline `{{ collection.all_products_count }} pieces, crafted with premium fashion finish`.
- Sidebar (from `ShopFilters.tsx`): search input (submits to `/search?q=`), **Category** list = links to the 6 category collections (+ "All"), **Curated** = links to `new-arrivals` / `best-sellers`, **Price** range from `collection.filters` where `filter.type == 'price_range'` (slider floor/ceiling from `filter.range_max`), **Size** from `filter.type == 'list'` and `filter.label == 'Size'`. Filter changes submit via `collection.mjs` to the current URL with `filter.*` params (Search & Discovery format) and re-render `[data-collection-grid]` from the fetched HTML (`?section_id=`).
- Sort select maps: Featured → `manual`, Price: Low to High → `price-ascending`, Price: High to Low → `price-descending`, Newest First → `created-descending`.
- `{% paginate collection.products by 12 %}` with numbered pills.
- Grid `grid-cols-2 lg:grid-cols-3`, empty state copy "No pieces match your selected filters".
- Search template reuses the grid for `search.results` filtered to products.

- [ ] **Step 1: Build sections, templates, JS.**
- [ ] **Step 2: Verify** on `/collections/all`, `/collections/earrings`, `/collections/new-arrivals?sort_by=price-ascending`, `/search?q=heart`; pagination at 133 products = 12 pages.
- [ ] **Step 3: Commit** — `feat(theme): collection and search templates`

---

## Phase 6 — Product page

### Task 18: Gallery and purchase panel

**Files:**
- Create: `sections/main-product.liquid`, `templates/product.json`
- Create: `snippets/product-gallery.liquid`, `snippets/purchase-panel.liquid`
- Create: `src/js/gallery.mjs`, `src/js/purchase.mjs`
- Test: `test/purchase.test.mjs`, `test/gallery.test.mjs`

**Interfaces:**
- Gallery (`ProductGallery.tsx`): main image, thumbnails, autoplay with progress bar `AUTOPLAY_DURATION_MS = 3500` tick 50 ms, pause on interaction, swipe, lightbox with Esc / ← / →. `nextIndex(i, len, dir) → number` wraps (test: `nextIndex(0, 3, -1) === 2`).
- Purchase panel (`ProductPurchasePanel.tsx`): eyebrow (`product.metafields.custom.eyebrow`), In Stock / Out of Stock badge, H1, Judge.me star badge placeholder `<div class="jdgm-widget jdgm-preview-badge" data-id="{{ product.id }}">`, price / compare-at / `Save N%`, "Inclusive of all taxes • Free Insured Delivery across India", description, **Metal Finish** swatch (metafields `metal_finish`/`metal_hex`, single, selected), **Size** buttons when `product.options_by_name['Size']`, qty box, `Add to Bag | ₹price`, `Buy Now | Instant Checkout` (add then `location.href = '/checkout'`), `Bulk Inquiry on WhatsApp` (`https://wa.me/<settings.whatsapp_number>?text=` with the exact message from the React component), Wishlist toggle, Share (`navigator.share` → clipboard fallback), pincode form (6-digit regex, success/invalid copy verbatim), 3 trust tiles, Specifications/Shipping `<details>`. Notify-me button when unavailable (Task 19).
- `savingsPercent(price, compareAt) → number|null` (test: `(939, 1139) → 18`, `(939, null) → null`); `variantFor(product, size) → variant` reuses `selectVariant` from Task 12.

- [ ] **Step 1: Failing tests → implement `gallery.mjs`/`purchase.mjs` helpers → PASS.**
- [ ] **Step 2: Build section/snippets** with `{% form 'product' %}` for no-JS fallback and `cart.mjs` for Ajax.
- [ ] **Step 3: Verify** on `/products/diamond-x-pattern-16-17-18-size` (3 sizes) and `/products/captivate` (single) vs live pages; sticky panel at `lg`.
- [ ] **Step 4: Commit** — `feat(theme): product gallery and purchase panel`

### Task 19: Accordions, related, guarantee strip, reviews, notify-me

**Files:**
- Create: `snippets/product-accordions.liquid` (5 titles: Design Story & Inspiration, Specifications & Materials, Jewellery Care Guide, Shipping, Returns & Warranty, Frequently Asked Questions — bodies ported from `ProductAccordions.tsx`, material from metafield)
- Create: `snippets/product-related.liquid` + `src/js/related.mjs` (`/recommendations/products.json?product_id=&limit=6&intent=related`, horizontal scroll of product cards, heading "You May Also Like")
- Create: `snippets/guarantee-strip.liquid` (6 items verbatim)
- Create: `snippets/reviews.liquid` (`<div id="judgeme_product_reviews" class="jdgm-widget jdgm-review-widget" data-product-title="{{ product.title }}" data-id="{{ product.id }}">`, heading "Verified Buyer Reviews"; CSS overrides in `elaraa.css` for gold stars/serif headings)
- Create: `snippets/notify-modal.liquid` (`{% form 'contact' %}` with `contact[Product]`, `contact[Variant]`, `contact[Phone]`, `contact[Email]`, subject `Notify me: {{ product.title }}`; copy from `NotifyMeModal.tsx`)

- [ ] **Step 1: Build all snippets; wire into `main-product.liquid`.**
- [ ] **Step 2: Verify** — out-of-stock product opens notify modal and submitting sends the store-owner email; related row shows 6 cards; Judge.me widget renders after app install (Task 23).
- [ ] **Step 3: Commit** — `feat(theme): product accordions, related, guarantee, reviews, notify-me`

---

## Phase 7 — Cart page, static pages, customer accounts

### Task 20: Cart page

**Files:**
- Create: `sections/main-cart.liquid`, `templates/cart.json`, `src/js/cart-page.mjs`
- Test: `test/discount-url.test.mjs`

**Interfaces:**
- From `app/cart/page.tsx`: line items with qty/remove, free-shipping progress (shared helper), **Coupon** field → `applyDiscountUrl(code) → '/discount/<CODE>?redirect=%2Fcart'` (test: lowercases trimmed → uppercased, encodes) and shows "Code will be applied at checkout"; **Gift Packaging** checkbox adds/removes `settings.gift_packaging_product` variant (qty 1) and shows `+ ₹99`; **upsell** card = first `recommendations` product not in cart; totals: Subtotal, Gift Packaging, "Shipping & taxes calculated at checkout"; `Proceed to Checkout` → `/checkout`; empty state with `Continue Shopping` → `/collections/all`.

- [ ] **Step 1: Failing test → implement → PASS.**
- [ ] **Step 2: Build section + JS.**
- [ ] **Step 3: Verify** — gift checkbox toggles a line; coupon redirect lands back on cart with Shopify's discount banner at checkout.
- [ ] **Step 4: Commit** — `feat(theme): cart page with coupon redirect and gift packaging`

### Task 21: About, Contact, Policy, 404 pages

**Files:**
- Create: `sections/about-hero.liquid`, `sections/about-atelier.liquid`, `sections/about-promise.liquid`, `sections/about-stats.liquid`, `sections/about-gallery.liquid`, `sections/about-cta.liquid`, `templates/page.about.json`
- Create: `sections/contact-hero.liquid`, `sections/contact-cards.liquid` (Call / Email / WhatsApp / Appointment, values from settings), `sections/contact-form.liquid` (`{% form 'contact' %}` fields name, email, phone, subject select default "Bridal & Bespoke", message; success copy from `contact/page.tsx`), `templates/page.contact.json`
- Create: `sections/policy-blocks.liquid` (blocks with `anchor` text: shipping, authenticity, privacy, terms, care; headings/bodies ported from `policy/page.tsx`; `scroll-mt-28`), `templates/page.policy.json`
- Create: `templates/404.json`, `sections/main-404.liquid` — the 404 section must also handle the legacy `/shop` URL, which Shopify refuses to redirect (reserved prefix): when `request.path == '/shop'`, emit `<meta http-equiv="refresh" content="0; url=/collections/all">` plus a visible link, and set `<link rel="canonical" href="/collections/all">`.
- Create: `src/js/counter.mjs` — `animateCounter(el, target, durationMs)` port of `AnimatedCounter.tsx`

- [ ] **Step 1: Build sections/templates**; About copy and the two Cloudinary hero images are section defaults (image pickers so they can be replaced).
- [ ] **Step 2: Verify** each page vs live; footer anchors `/pages/policy#shipping` scroll to the right block.
- [ ] **Step 3: Commit** — `feat(theme): about, contact, policy, 404`

### Task 22: Classic customer account templates

**Files:**
- Create: `templates/customers/login.json`, `register.json`, `reset_password.json`, `activate_account.json`, `account.json`, `order.json`, `addresses.json`
- Create: `sections/main-login.liquid`, `main-register.liquid`, `main-reset.liquid`, `main-activate.liquid`, `main-account.liquid`, `main-order.liquid`, `main-addresses.liquid`
- Create: `snippets/account-nav.liquid` (Profile → `/account`, Orders → `/account#orders`, Addresses → `/account/addresses`, Wishlist → `/pages/wishlist`)

**Interfaces:** Markup/copy from `(auth)/login/page.tsx` ("Welcome Back" / "Sign In", "Forgot your password?", "New to ELARAA? Create an account"), register, forgot (`{% form 'recover_customer_password' %}`), `account/layout.tsx` nav, orders list and order detail (`customer.orders`, `order.line_items`), addresses CRUD via `{% form 'customer_address' %}`.

- [ ] **Step 1: Build templates/sections.**
- [ ] **Step 2: Verify** — register, log in, add address, view the test order from Task 24.
- [ ] **Step 3: Commit** — `feat(theme): classic customer account templates`

---

## Phase 8 — Store configuration (admin checklist)

### Task 23: Configure the Shopify store

Record each step as done in `shopify/STORE-SETUP.md` with the date.

- [ ] **General:** store name ELARAA, currency INR, timezone Asia/Kolkata, address Jamnagar, Gujarat.
- [ ] **Taxes:** Settings → Taxes and duties → India → GST registration; enable **"Include tax in prices"**; set 3 % on all products (or product-tax override collection if needed).
- [ ] **Shipping:** one India zone; rate "Free Insured Shipping" condition order ≥ ₹2,000; rate "Standard" below ₹2,000 at the fee read in Phase 0.
- [ ] **Payments:** install **Razorpay Secure** from the App Store and activate with live keys; enable **Manual payment → Cash on Delivery** named "Cash on Delivery".
- [ ] **Checkout:** Settings → Checkout → Customer accounts = **Classic**; branding: logo `logo-elaraa-full.png`, background `#F8F5F0`, buttons `#A8823D`, fonts Cormorant Garamond / Jost; order status page copy "Thank You".
- [ ] **Apps:** Search & Discovery (filters: Price, Availability, Size; exclude tag `hidden` from search), Judge.me (free; disable its own CSS theme so overrides apply), Facebook & Instagram (connect pixel used by `MetaPixel.tsx`).
- [ ] **Navigation:** menus `main-menu`, `mobile-menu`, `footer-collections` (Statement Earrings → `/collections/earrings`, Elegant Necklaces → `/collections/necklaces`, Daily Wear Rings → `/collections/rings`, New Arrivals → `/collections/new-arrivals`), `footer-support` (links in Task 11).
- [ ] **Pages:** create `about`, `contact`, `policy`, `wishlist` and assign templates `page.about`, `page.contact`, `page.policy`, `page.wishlist`. Set `/collections/all` title "Shop All Jewellery".
- [ ] **Discounts:** recreate each coupon from Phase 0 as a Shopify discount code (percentage / fixed, min order, usage limits).
- [ ] **Notifications:** upload logo, set accent colour `#A8823D` in Settings → Notifications → Customize.
- [ ] **Theme settings:** upload `shopify theme push --unpublished`, open the theme editor, confirm defaults from Global Constraints, pick the Gift Packaging product.
- [ ] Commit `shopify/STORE-SETUP.md`.

---

## Phase 9 — QA, packaging, launch

### Task 24: Parity QA and test orders

- [ ] **Step 1:** For each template (home, `/collections/all`, `/collections/earrings`, product single-variant, product sized, cart, about, contact, policy, login, account, search, 404) capture screenshots at 390 / 768 / 1440 / 1700 px from the dev theme and from elaraaluxes.com; list every visible difference in `shopify/QA-PARITY.md`; fix until the list is empty or each remaining line is an accepted platform difference from the spec.
- [ ] **Step 2:** `npm run check` → 0 errors, 0 warnings that are not Skeleton defaults.
- [ ] **Step 3:** Lighthouse mobile on home and product ≥ 80 performance (GSAP/Lenis deferred, images lazy).
- [ ] **Step 4:** Place a COD test order and a Razorpay **test-mode** order from the unpublished theme (preview link); confirm order emails, inventory decrement, and the order appears under `/account`.
- [ ] **Step 5:** Commit QA notes.

### Task 25: Package and go live

- [ ] **Step 1:** `cd shopify/theme && npm run build && shopify theme package` → `elaraa-theme-<version>.zip`; upload via **Online Store → Themes → Add theme → Upload zip file** on the production store to prove the zip path works; publish.
- [ ] **Step 2:** Back up production Postgres (`pg_dump`) and download the Cloudinary folder list before DNS changes.
- [ ] **Step 3:** Settings → Domains → connect `elaraaluxes.com` (A record `23.227.38.65`, `www` CNAME `shops.myshopify.com`, as the admin shows); set as primary; wait for SSL.
- [ ] **Step 4:** Verify redirects from Task 3 resolve on the live domain; verify Meta pixel fires.
- [ ] **Step 5:** After 7 clean days: pause the Railway backend and Vercel project (do not delete for 30 days), remove `api.elaraaluxes.com` DNS last.
- [ ] **Step 6:** Tag the repo `shopify-launch` and commit `shopify/LAUNCH-LOG.md`.

---

## Self-review notes

- **Spec coverage:** every row of the spec's decision table maps to a task (CSV/metafields → 2; collections/tags → 4; filters/search → 17/9; wishlist → 13; notify-me → 19; gift → 3/20; coupons → 20/23; checkout/payments/taxes/accounts → 22/23; pixel → 23; redirects → 3/4; combo/invoices dropped → no task by design).
- **Known accepted gaps:** query-string redirects (`/shop?category=`) are impossible on Shopify; checkout and confirmation pages are Shopify-designed; email verification on registration does not exist.
- **Type consistency:** `addItem(variantId, quantity, fetchImpl?)`, `shippingProgress(subtotalCents, thresholdRupees)`, `selectVariant(productJson, { size })`, `formatPrice(cents)`, `createWishlist(storage?)` are the shared names across Tasks 8–20.

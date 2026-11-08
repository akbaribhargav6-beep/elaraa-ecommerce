# ELARAA → Shopify catalog migration

Exports the **live** catalog from `https://api.elaraaluxes.com` and builds the CSV files Shopify's admin imports. No dependencies beyond Node 20+.

```bash
cd shopify/migration
npm run fetch    # → out/products.json, out/categories.json   (133 products, 6 categories)
npm run build    # → out/products.csv (134 products incl. gift-packaging, 168 images)
                 #   out/redirects.csv (145 rows)
npm test         # node --test
```

Set `ELARAA_API_URL` to point `fetch` at another origin (e.g. the Railway fallback URL).

`npm run build` aborts if any variant row would import with a blank price (Shopify would silently set ₹0.00). It prints a **warning per product whose SKU is blank**: the public API omits inactive variants, so the 6 currently sold-out products arrive with no variant. They are imported at their live price with quantity 0 and no SKU. Re-enter those 6 SKUs from the old admin after import (list them in `IMPORT-LOG.md`).

## Importing into Shopify (plan Task 4)

1. **Products** — Shopify admin → Products → Import → `out/products.csv`. Do not open the file in Excel first (it re-types size values like `16`).
2. **Collections** — create automated collections on the tag `category:<slug>` for `earrings`, `rings`, `necklaces`, `bracelets`, `charms`, `duo-set`, plus `new-arrivals` (tag `new-arrival`), `best-sellers` (`best-seller`) and `featured` (`featured`).
3. **Redirects** — Online Store → Navigation → URL redirects → Import → `out/redirects.csv`. Shopify rejects redirects from reserved prefixes, so there is **no row for `/shop`**: the theme's 404 template sends `/shop` to `/collections/all` instead (plan Task 21). Query-string URLs (`/shop?category=…`) cannot be redirected at all.
4. Exclude tag `hidden` (the gift-packaging add-on) from search in the Search & Discovery app.

## What the CSV encodes

- Handle = live slug, Title = live name (trimmed), Vendor `ELARAA`, Type = category name.
- Only **Size** becomes a Shopify option; products without sizes use `Title / Default Title`.
- Metal finish, eyebrow, material and short description go to `custom.*` metafield columns (`metal_finish`, `metal_hex`, `eyebrow`, `material`, `short_description`). Metal spellings are normalised to `Anti Tarnish` / `Gold Plated`.
- Tags: `category:<slug>` and any of `featured`, `best-seller`, `new-arrival`.
- Inventory tracked by Shopify, policy `deny`, prices tax-inclusive (`Variant Taxable = TRUE`).
- `SEO Description` is capped at Shopify's 320 characters on a word boundary; the full short description is kept in the `custom.short_description` metafield.
- Extra images are handle-only rows; image URLs stay on Cloudinary and are fetched by Shopify during import.

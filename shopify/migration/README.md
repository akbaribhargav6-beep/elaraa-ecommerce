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

## Importing into Shopify (plan Task 4)

1. **Products** — Shopify admin → Products → Import → `out/products.csv`. Do not open the file in Excel first (it re-types size values like `16`).
2. **Collections** — create automated collections on the tag `category:<slug>` for `earrings`, `rings`, `necklaces`, `bracelets`, `charms`, `duo-set`, plus `new-arrivals` (tag `new-arrival`), `best-sellers` (`best-seller`) and `featured` (`featured`).
3. **Redirects** — Online Store → Navigation → URL redirects → Import → `out/redirects.csv`.
4. Exclude tag `hidden` (the gift-packaging add-on) from search in the Search & Discovery app.

## What the CSV encodes

- Handle = live slug, Title = live name (trimmed), Vendor `ELARAA`, Type = category name.
- Only **Size** becomes a Shopify option; products without sizes use `Title / Default Title`.
- Metal finish, eyebrow, material and short description go to `custom.*` metafield columns (`metal_finish`, `metal_hex`, `eyebrow`, `material`, `short_description`). Metal spellings are normalised to `Anti Tarnish` / `Gold Plated`.
- Tags: `category:<slug>` and any of `featured`, `best-seller`, `new-arrival`.
- Inventory tracked by Shopify, policy `deny`, prices tax-inclusive (`Variant Taxable = TRUE`).
- Extra images are handle-only rows; image URLs stay on Cloudinary and are fetched by Shopify during import.

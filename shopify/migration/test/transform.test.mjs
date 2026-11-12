import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMetal, productTags, productToRows, validateRows, truncateSeo, CSV_HEADERS } from '../src/transform.mjs';
import { toCsv } from '../src/csv.mjs';

const base = {
  name: 'Diamond X Pattern ',
  slug: 'diamond-x-pattern-16-17-18-size',
  categorySlug: 'rings',
  eyebrow: 'X PATTERN RING',
  shortDescription: 'short',
  description: 'long',
  material: 'Water Proof',
  basePrice: 939,
  compareAtPrice: 1139,
  isActive: true,
  isFeatured: false,
  isNewArrival: true,
  isBestSeller: false,
  images: [
    { url: 'https://res.cloudinary.com/x/a.png', altText: null, sortOrder: 0, isPrimary: true },
    { url: 'https://res.cloudinary.com/x/b.png', altText: null, sortOrder: 1, isPrimary: false },
  ],
  variants: [
    { sku: 'RG-G-246', metalLabel: 'Anti tarnish', metalHex: '#C9A66B', backType: '', size: '16', price: 939, stockQuantity: 20, isActive: true },
    { sku: 'RG-G-246.1', metalLabel: 'Anti tarnish', metalHex: '#C9A66B', backType: '', size: '17', price: 939, stockQuantity: 0, isActive: true },
  ],
};

test('normalizeMetal collapses every live spelling', () => {
  for (const s of ['Anti Tarnish', 'Anti tarnish', 'Anti Tarnish ', 'AntiTarnish', 'Anti-Tarnish']) {
    assert.equal(normalizeMetal(s), 'Anti Tarnish', JSON.stringify(s));
  }
  assert.equal(normalizeMetal('Gold Plated'), 'Gold Plated');
});

test('productTags emits category and flag tags', () => {
  assert.deepEqual(productTags(base), ['category:rings', 'new-arrival']);
  assert.deepEqual(productTags({ ...base, isFeatured: true, isBestSeller: true, isNewArrival: false }), ['category:rings', 'featured', 'best-seller']);
});

test('sized product → one row per size, title trimmed, size kept as string', () => {
  const rows = productToRows(base, { rings: 'Rings' });
  const variantRows = rows.filter((r) => r['Variant SKU'] !== '');
  assert.equal(variantRows.length, 2);
  assert.equal(rows[0].Handle, base.slug);
  assert.equal(rows[0].Title, 'Diamond X Pattern');
  assert.equal(rows[0].Type, 'Rings');
  assert.equal(rows[0].Vendor, 'ELARAA');
  assert.equal(rows[0].Tags, 'category:rings, new-arrival');
  assert.equal(rows[0]['Option1 Name'], 'Size');
  assert.equal(rows[0]['Option1 Value'], '16');
  assert.equal(rows[0]['Variant Price'], '939');
  assert.equal(rows[0]['Variant Compare At Price'], '1139');
  assert.equal(rows[0]['Variant Inventory Qty'], '20');
  assert.equal(rows[0]['Variant Inventory Policy'], 'deny');
  assert.equal(rows[0].Status, 'active');
  assert.equal(rows[0]['Body (HTML)'], '<p>long</p>');
  assert.equal(rows[0]['SEO Title'], 'Diamond X Pattern | ELARAA');
  assert.equal(rows[0]['Metal Finish (product.metafields.custom.metal_finish)'], 'Anti Tarnish');
  assert.equal(rows[0]['Metal Hex (product.metafields.custom.metal_hex)'], '#C9A66B');
  assert.equal(variantRows[1]['Option1 Value'], '17');
  assert.equal(variantRows[1]['Variant Inventory Qty'], '0');
  assert.equal(variantRows[1].Title, '', 'second variant row must not repeat the title');
  assert.equal(variantRows[1]['Metal Finish (product.metafields.custom.metal_finish)'], '', 'metafields only on row 1');
});

test('extra images become handle-only rows', () => {
  const rows = productToRows(base, { rings: 'Rings' });
  assert.equal(rows[0]['Image Src'], 'https://res.cloudinary.com/x/a.png');
  assert.equal(rows[0]['Image Position'], '1');
  assert.equal(rows[0]['Image Alt Text'], 'Diamond X Pattern');
  const imgRow = rows.find((r) => r['Image Position'] === '2');
  assert.ok(imgRow, 'second image row exists');
  assert.equal(imgRow.Handle, base.slug);
  assert.equal(imgRow.Title, '');
  assert.equal(imgRow['Option1 Name'], '');
  assert.equal(imgRow['Variant SKU'], '');
  assert.equal(imgRow['Image Src'], 'https://res.cloudinary.com/x/b.png');
});

test('single-variant product uses Default Title', () => {
  const p = { ...base, variants: [{ ...base.variants[0], size: '' }], images: base.images.slice(0, 1) };
  const rows = productToRows(p, { rings: 'Rings' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]['Option1 Name'], 'Title');
  assert.equal(rows[0]['Option1 Value'], 'Default Title');
});

test('inactive product is imported as draft', () => {
  const rows = productToRows({ ...base, isActive: false }, { rings: 'Rings' });
  assert.equal(rows[0].Status, 'draft');
});

test('product with no active variants keeps its live price, qty 0, blank SKU', () => {
  // The public API drops inactive variants, so 6 live sold-out products arrive
  // with variants: [] — they must never import at ₹0.
  const rows = productToRows({ ...base, variants: [], images: base.images.slice(0, 1) }, { rings: 'Rings' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]['Option1 Name'], 'Title');
  assert.equal(rows[0]['Option1 Value'], 'Default Title');
  assert.equal(rows[0]['Variant Price'], '939');
  assert.equal(rows[0]['Variant Compare At Price'], '1139');
  assert.equal(rows[0]['Variant Inventory Qty'], '0');
  assert.equal(rows[0]['Variant SKU'], '');
  assert.equal(rows[0]['Metal Finish (product.metafields.custom.metal_finish)'], 'Anti Tarnish');
  assert.equal(rows[0]['Metal Hex (product.metafields.custom.metal_hex)'], '#C9A66B');
});

test('truncateSeo caps SEO Description at 320 chars on a word boundary', () => {
  assert.equal(truncateSeo('short text'), 'short text');
  const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' '); // > 320 chars
  const out = truncateSeo(long);
  assert.ok(out.length <= 320, `length ${out.length}`);
  assert.ok(!out.endsWith(' '), 'no trailing space');
  assert.ok(long.startsWith(out.replace(/…$/, '')), 'prefix preserved');
  assert.ok(/word\d+…$/.test(out), 'ends on a whole word plus ellipsis');
});

test('productToRows applies the SEO cap but keeps the full short description metafield', () => {
  const long = 'x'.repeat(100) + ' ' + 'y'.repeat(300);
  const rows = productToRows({ ...base, shortDescription: long }, { rings: 'Rings' });
  assert.ok(rows[0]['SEO Description'].length <= 320);
  assert.equal(rows[0]['Short Description (product.metafields.custom.short_description)'], long);
});

test('validateRows flags variant rows with a blank price and warns on blank SKUs', () => {
  const ok = productToRows(base, { rings: 'Rings' });
  assert.deepEqual(validateRows(ok), { errors: [], warnings: [] });
  const noSku = productToRows({ ...base, variants: [] }, { rings: 'Rings' });
  assert.deepEqual(validateRows(noSku).errors, []);
  assert.deepEqual(validateRows(noSku).warnings, [`${base.slug}: blank Variant SKU`]);
  const broken = ok.map((r) => ({ ...r, 'Variant Price': '' }));
  assert.ok(validateRows(broken).errors.some((e) => e.startsWith(`${base.slug}: blank Variant Price`)));
  const imageOnly = ok.filter((r) => r['Image Position'] === '2');
  assert.deepEqual(validateRows(imageOnly), { errors: [], warnings: [] }, 'image rows are not variant rows');
});

test('every row has exactly the CSV header keys', () => {
  const rows = productToRows(base, { rings: 'Rings' });
  for (const r of rows) assert.deepEqual(Object.keys(r), CSV_HEADERS);
});

test('toCsv quotes commas, quotes and newlines', () => {
  assert.equal(toCsv([{ A: 'x, "y"', B: '1' }], ['A', 'B']), 'A,B\n"x, ""y""",1');
  assert.equal(toCsv([{ A: 'line1\nline2', B: '' }], ['A', 'B']), 'A,B\n"line1\nline2",');
});

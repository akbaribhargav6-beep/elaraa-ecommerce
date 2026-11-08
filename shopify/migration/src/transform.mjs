// Maps a live ELARAA ProductDTO (see shared/src/types/index.ts) onto rows of
// Shopify's product-import CSV. Rules follow the spec's "Platform decisions":
// only Size becomes a Shopify option; the metal finish lives in metafields.

export const CSV_HEADERS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Variant SKU',
  'Variant Inventory Tracker',
  'Variant Inventory Qty',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'SEO Title',
  'SEO Description',
  'Status',
  'Eyebrow (product.metafields.custom.eyebrow)',
  'Material (product.metafields.custom.material)',
  'Short Description (product.metafields.custom.short_description)',
  'Metal Finish (product.metafields.custom.metal_finish)',
  'Metal Hex (product.metafields.custom.metal_hex)',
];

const DEFAULT_METAL_HEX = '#C9A66B';

/** Collapses the live catalog's inconsistent metal spellings. */
export function normalizeMetal(label) {
  const compact = String(label ?? '').trim().toLowerCase().replace(/[\s-]+/g, '');
  if (compact === 'antitarnish') return 'Anti Tarnish';
  return String(label ?? '').trim();
}

/** Tags drive the automated collections (category + merchandising flags). */
export function productTags(p) {
  const tags = [`category:${p.categorySlug}`];
  if (p.isFeatured) tags.push('featured');
  if (p.isBestSeller) tags.push('best-seller');
  if (p.isNewArrival) tags.push('new-arrival');
  return tags;
}

function emptyRow() {
  return Object.fromEntries(CSV_HEADERS.map((h) => [h, '']));
}

function str(v) {
  return v === null || v === undefined ? '' : String(v);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function variantCells(row, v) {
  row['Variant SKU'] = str(v.sku);
  row['Variant Inventory Tracker'] = 'shopify';
  row['Variant Inventory Qty'] = str(v.stockQuantity ?? 0);
  row['Variant Inventory Policy'] = 'deny';
  row['Variant Fulfillment Service'] = 'manual';
  row['Variant Price'] = str(v.price);
  row['Variant Requires Shipping'] = 'TRUE';
  row['Variant Taxable'] = 'TRUE';
  return row;
}

/**
 * @param {object} p ProductDTO
 * @param {Record<string,string>} categoryNames slug → display name (for `Type`)
 * @returns {Record<string,string>[]} rows keyed by CSV_HEADERS
 */
export function productToRows(p, categoryNames = {}) {
  const title = String(p.name ?? '').trim();
  const images = [...(p.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const variants = (p.variants ?? []).filter((v) => v.isActive !== false);
  const sized = variants.some((v) => String(v.size ?? '').trim() !== '');
  const first = variants[0] ?? {};

  const head = emptyRow();
  head.Handle = p.slug;
  head.Title = title;
  head['Body (HTML)'] = p.description ? `<p>${escapeHtml(p.description)}</p>` : '';
  head.Vendor = 'ELARAA';
  head.Type = categoryNames[p.categorySlug] ?? p.categorySlug;
  head.Tags = productTags(p).join(', ');
  head.Published = 'TRUE';
  head.Status = p.isActive === false ? 'draft' : 'active';
  head['SEO Title'] = `${title} | ELARAA`;
  head['SEO Description'] = str(p.shortDescription);
  head['Eyebrow (product.metafields.custom.eyebrow)'] = str(p.eyebrow).trim();
  head['Material (product.metafields.custom.material)'] = str(p.material).trim();
  head['Short Description (product.metafields.custom.short_description)'] = str(p.shortDescription);
  head['Metal Finish (product.metafields.custom.metal_finish)'] = normalizeMetal(first.metalLabel);
  head['Metal Hex (product.metafields.custom.metal_hex)'] = first.metalHex || DEFAULT_METAL_HEX;
  head['Variant Compare At Price'] = str(p.compareAtPrice);

  const rows = [];
  const variantRows = sized
    ? variants.map((v) => ({ ...v, optionValue: String(v.size).trim() }))
    : [{ ...first, optionValue: 'Default Title' }];

  variantRows.forEach((v, i) => {
    const row = i === 0 ? head : emptyRow();
    if (i > 0) {
      row.Handle = p.slug;
      row['Variant Compare At Price'] = str(p.compareAtPrice);
    }
    row['Option1 Name'] = sized ? 'Size' : 'Title';
    row['Option1 Value'] = v.optionValue;
    variantCells(row, v);
    rows.push(row);
  });

  images.forEach((img, i) => {
    const row = i === 0 ? rows[0] : emptyRow();
    if (i > 0) row.Handle = p.slug;
    row['Image Src'] = img.url;
    row['Image Position'] = String(i + 1);
    row['Image Alt Text'] = img.altText || title;
    if (i > 0) rows.push(row);
  });

  return rows;
}

/**
 * The ₹99 gift-packaging add-on the cart page adds via the Ajax Cart API.
 * Tagged `hidden` so Search & Discovery can exclude it; inventory policy
 * `continue` so it can never block a checkout by going out of stock.
 */
export function giftPackagingRows() {
  const row = emptyRow();
  row.Handle = 'gift-packaging';
  row.Title = 'Gift Packaging';
  row['Body (HTML)'] = '<p>Signature ELARAA velvet box, luxury ribbon and personalised care card.</p>';
  row.Vendor = 'ELARAA';
  row.Type = 'Add-on';
  row.Tags = 'hidden';
  row.Published = 'TRUE';
  row.Status = 'active';
  row['Option1 Name'] = 'Title';
  row['Option1 Value'] = 'Default Title';
  variantCells(row, { sku: 'ADDON-GIFT', stockQuantity: 0, price: 99 });
  row['Variant Inventory Policy'] = 'continue';
  row['SEO Title'] = 'Gift Packaging | ELARAA';
  return [row];
}

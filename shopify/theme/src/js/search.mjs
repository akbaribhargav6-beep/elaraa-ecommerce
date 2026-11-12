// Predictive Search API helpers (replaces /api/products?search= in the
// Next.js HeaderSearch). Pure functions, unit-tested in test/search.test.mjs.

export const RESULT_LIMIT = 6;
export const MIN_QUERY_LENGTH = 2;

export function buildSuggestUrl(query, limit = RESULT_LIMIT, base = '/search/suggest.json') {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('resources[type]', 'product');
  params.set('resources[limit]', String(limit));
  params.set('resources[options][unavailable_products]', 'last');
  params.set('resources[options][fields]', 'title,product_type,variants.title,variants.sku,tag');
  return `${base}?${params.toString()}`;
}

/** "1,234.00" | "₹1,189.50" → paise */
export function priceStringToCents(price) {
  const n = parseFloat(String(price ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Flattens the suggest.json payload into what the dropdown renders. */
export function parsePredictiveProducts(json) {
  const products = json?.resources?.results?.products ?? [];
  return products.map((p) => ({
    title: p.title,
    url: p.url,
    priceCents: priceStringToCents(p.price),
    type: p.type || '',
    available: p.available !== false,
    image: p.featured_image?.url ?? null,
    imageAlt: p.featured_image?.alt || p.title,
  }));
}

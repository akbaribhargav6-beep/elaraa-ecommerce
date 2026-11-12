// Legacy URL handling. The Next.js site's shop lived at /shop?category=… —
// Shopify can redirect neither the reserved /shop path nor query strings, so
// the 404 template (sections/main-404.liquid) hands those requests to this
// mapper and sends the shopper to the matching collection.

const SORT_MAP = {
  price_asc: 'price-ascending',
  price_desc: 'price-descending',
  newest: 'created-descending',
};

/**
 * @param {string} search location.search of the old URL
 * @param {{all: string, collections: string, search: string}} routes
 */
export function legacyShopTarget(search, routes) {
  const params = new URLSearchParams(search);

  const term = (params.get('search') || '').trim();
  if (term) {
    const q = new URLSearchParams({ q: term, type: 'product' });
    return `${routes.search}?${q.toString()}`;
  }

  let path = routes.all;
  const category = params.get('category') || '';
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category)) path = `${routes.collections}/${category}`;
  else if (params.get('newArrival') === 'true') path = `${routes.collections}/new-arrivals`;
  else if (params.get('bestSeller') === 'true') path = `${routes.collections}/best-sellers`;
  else if (params.get('featured') === 'true') path = `${routes.collections}/featured`;

  const sort = SORT_MAP[params.get('sort')];
  return sort ? `${path}?sort_by=${sort}` : path;
}

export function initLegacyRedirect() {
  const el = document.querySelector('[data-legacy-shop]');
  if (!el) return;
  const target = legacyShopTarget(window.location.search, {
    all: el.dataset.allUrl,
    collections: el.dataset.collectionsUrl,
    search: el.dataset.searchUrl,
  });
  window.location.replace(target);
}

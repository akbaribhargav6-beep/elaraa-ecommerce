// Shopify URL-redirect CSV rows (Online Store → Navigation → URL redirects →
// Import). Shopify matches paths only — query strings such as
// /shop?category=earrings cannot be redirected, so the theme's nav links
// point straight at collection URLs instead.

export const REDIRECT_HEADERS = ['Redirect from', 'Redirect to'];

const STATIC_REDIRECTS = [
  ['/shop', '/collections/all'],
  ['/about', '/pages/about'],
  ['/contact', '/pages/contact'],
  ['/policy', '/pages/policy'],
  ['/login', '/account/login'],
  ['/register', '/account/register'],
  ['/forgot-password', '/account/login'],
  ['/reset-password', '/account/login'],
  ['/verify-email', '/account/login'],
  ['/account/orders', '/account'],
  ['/account/addresses', '/account/addresses'],
  ['/account/wishlist', '/pages/wishlist'],
];

/** @param {{slug: string}[]} products */
export function redirectRows(products) {
  const rows = products.map((p) => ({ 'Redirect from': `/product/${p.slug}`, 'Redirect to': `/products/${p.slug}` }));
  for (const [from, to] of STATIC_REDIRECTS) rows.push({ 'Redirect from': from, 'Redirect to': to });
  return rows;
}

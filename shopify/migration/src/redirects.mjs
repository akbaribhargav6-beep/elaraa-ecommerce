// Shopify URL-redirect CSV rows (Online Store → Navigation → URL redirects →
// Import). Two Shopify rules shape this list:
//  - paths only: query strings such as /shop?category=earrings cannot be
//    redirected, so the theme's nav links point straight at collection URLs;
//  - reserved prefixes (/shop, /cart, /apps, /orders, /services, …) and paths
//    that still resolve are rejected by the importer. The old /shop URL is
//    therefore handled in the theme's 404 template (plan Task 21), and
//    /account/addresses needs no row because it is the same path on Shopify.

export const REDIRECT_HEADERS = ['Redirect from', 'Redirect to'];

const STATIC_REDIRECTS = [
  ['/about', '/pages/about'],
  ['/contact', '/pages/contact'],
  ['/policy', '/pages/policy'],
  ['/login', '/account/login'],
  ['/register', '/account/register'],
  ['/forgot-password', '/account/login'],
  ['/reset-password', '/account/login'],
  ['/verify-email', '/account/login'],
  ['/account/orders', '/account'],
  ['/account/wishlist', '/pages/wishlist'],
];

/** @param {{slug: string}[]} products */
export function redirectRows(products) {
  const rows = products.map((p) => ({ 'Redirect from': `/product/${p.slug}`, 'Redirect to': `/products/${p.slug}` }));
  for (const [from, to] of STATIC_REDIRECTS) rows.push({ 'Redirect from': from, 'Redirect to': to });
  return rows;
}

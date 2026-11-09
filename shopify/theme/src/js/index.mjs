// Entry point for assets/elaraa.js (bundled by esbuild, loaded with defer
// after the vendor GSAP / ScrollTrigger / Lenis scripts). Each plan task adds
// its module here.
import { formatPrice } from './money.mjs';
import { initMotion } from './motion.mjs';
import { initHeader } from './header.mjs';
import { createCartStore } from './cart.mjs';
import { initCartDrawer } from './cart-drawer.mjs';
import { initQuickView } from './quick-view.mjs';
import { initProductCards } from './product-card.mjs';
import { initWishlist } from './wishlist.mjs';
import { initCountdowns } from './countdown.mjs';
import { initSpotlights } from './spotlight.mjs';
import { notify } from './toast.mjs';

const ELARAA = (window.ELARAA = window.ELARAA || { settings: {}, cart: {}, routes: {} });
ELARAA.formatPrice = formatPrice;
ELARAA.notify = notify;

function readInitialCart() {
  const el = document.querySelector('[data-cart-json]');
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

function boot() {
  ELARAA.cartStore = createCartStore({ routes: ELARAA.routes, initial: readInitialCart() });
  initMotion(ELARAA.settings);
  initHeader(ELARAA.routes);
  initCartDrawer(ELARAA.cartStore);
  ELARAA.quickView = initQuickView(ELARAA.cartStore, { routes: ELARAA.routes });
  initProductCards(ELARAA.cartStore, ELARAA.quickView);
  ELARAA.wishlist = initWishlist({ routes: ELARAA.routes });
  initCountdowns();
  initSpotlights();
  document.addEventListener('shopify:section:load', (e) => initCountdowns(e.target));
  // The theme editor re-renders a section in place; re-bind the header then.
  document.addEventListener('shopify:section:load', () => initHeader(ELARAA.routes));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

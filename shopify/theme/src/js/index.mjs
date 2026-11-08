// Entry point for assets/elaraa.js (bundled by esbuild, loaded with defer
// after the vendor GSAP / ScrollTrigger / Lenis scripts). Each plan task adds
// its module here.
import { formatPrice } from './money.mjs';
import { initMotion } from './motion.mjs';
import { initHeader } from './header.mjs';
import { createCartStore } from './cart.mjs';
import { initCartDrawer } from './cart-drawer.mjs';
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
  // The theme editor re-renders a section in place; re-bind the header then.
  document.addEventListener('shopify:section:load', () => initHeader(ELARAA.routes));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

// Entry point for assets/elaraa.js (bundled by esbuild, loaded with defer
// after the vendor GSAP / ScrollTrigger / Lenis scripts). Each plan task adds
// its module here.
import { formatPrice } from './money.mjs';
import { initMotion } from './motion.mjs';

const ELARAA = (window.ELARAA = window.ELARAA || { settings: {}, cart: {}, routes: {} });
ELARAA.formatPrice = formatPrice;

function boot() {
  initMotion(ELARAA.settings);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

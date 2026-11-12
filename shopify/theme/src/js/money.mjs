// Mirrors frontend/src/lib/format.ts, but takes Shopify's smallest-unit
// amounts (paise) as returned by /cart.js and /products/<handle>.js.
const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** @param {number|string|null|undefined} cents amount in paise */
export function formatPrice(cents) {
  const n = Number(cents);
  const rupees = Number.isFinite(n) ? Math.round(n / 100) : 0;
  return `₹${INR.format(rupees)}`;
}

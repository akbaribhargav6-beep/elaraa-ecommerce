// Product purchase panel (ports frontend/src/components/product/ProductPurchasePanel.tsx):
// size selection, price / stock updates, quantity, Add to Bag, Buy Now,
// WhatsApp bulk inquiry, share and the pincode check. The markup lives in
// snippets/purchase-panel.liquid; pure helpers are unit-tested.
import { formatPrice } from './money.mjs';
import { selectVariant, sizeOptionIndex } from './quick-view.mjs';
import { notify, MESSAGES } from './toast.mjs';
import { CartError } from './cart.mjs';

const DEFAULT_PINCODE_COPY =
  'We deliver to {pincode}. Orders typically arrive in 3 to 5 business days, with Cash on Delivery available.';

/** Whole-percent saving, or null when there is nothing to show. Amounts in paise. */
export function savingsPercent(price, compareAt) {
  const p = Number(price);
  const c = Number(compareAt);
  if (!c || !(c > p)) return null;
  const pct = Math.round(((c - p) / c) * 100);
  return pct > 0 ? pct : null;
}

export function bulkInquiryUrl(whatsappNumber, productName, link) {
  const number = String(whatsappNumber ?? '').replace(/\D/g, '');
  const message = `Hello, I'm interested in bulk purchasing this product.\n\nProduct: ${productName}\nLink: ${link}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function isValidPincode(value) {
  return /^\d{6}$/.test(String(value ?? '').trim());
}

export function pincodeMessage(template, pincode) {
  return (template || DEFAULT_PINCODE_COPY).replace(/\{pincode\}/g, pincode);
}

const HARD_MAX_QTY = 99;

/** @param {number} [max] per-variant stock ceiling (see maxQtyFor) */
export function clampQty(value, max = HARD_MAX_QTY) {
  const ceiling = Math.max(1, Number.isFinite(Number(max)) ? Number(max) : HARD_MAX_QTY);
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return 1;
  return Math.min(ceiling, Math.max(1, n));
}

/**
 * Highest quantity the stepper allows for a variant. `stock` maps variant id →
 * tracked units, or null when Shopify does not limit the variant (untracked,
 * or "continue selling when out of stock").
 */
export function maxQtyFor(stock, variantId) {
  const units = stock ? stock[variantId] : null;
  if (units === null || units === undefined) return HARD_MAX_QTY;
  return Math.min(HARD_MAX_QTY, Math.max(1, Number(units) || 0));
}

/** pageshow fires with persisted=true when the browser restores the page from its back/forward cache. */
export function isBfcacheRestore(event) {
  return event?.persisted === true;
}

export function variantUrl(currentUrl, variantId) {
  const url = new URL(currentUrl);
  url.searchParams.set('variant', String(variantId));
  return url.toString();
}

function bind(panel, store, settings) {
  if (panel.dataset.bound === '1') return;
  panel.dataset.bound = '1';

  let product;
  try {
    product = JSON.parse(panel.querySelector('[data-product-json]').textContent);
  } catch {
    return;
  }

  const $ = (sel) => panel.querySelector(sel);
  const form = $('[data-product-form]');
  const idInput = $('[data-variant-id]');
  const qtyInput = $('[data-qty-input]');
  const priceEl = $('[data-price]');
  const compareEl = $('[data-compare-price]');
  const savingsEl = $('[data-savings]');
  const stockEl = $('[data-stock-badge]');
  const sizeLabel = $('[data-size-label]');
  const addBtn = $('[data-add-to-bag]');
  const buyBtn = $('[data-buy-now]');
  const availableBlock = $('[data-purchase-available]');
  const soldOutBlock = $('[data-purchase-soldout]');
  const sizeIdx = sizeOptionIndex(product);

  // Tracked stock per variant (the product JSON has no inventory quantity).
  let stock = null;
  try {
    stock = JSON.parse($('[data-inventory-json]').textContent);
  } catch {
    stock = null;
  }

  const initialId = Number(idInput?.value);
  let variant = product.variants.find((v) => v.id === initialId) || selectVariant(product, {});
  let busy = false;

  const paint = () => {
    if (!variant) return;
    const out = !variant.available;
    if (idInput) idInput.value = String(variant.id);
    if (priceEl) priceEl.textContent = formatPrice(variant.price);
    const compare = variant.compare_at_price > variant.price ? variant.compare_at_price : null;
    if (compareEl) {
      compareEl.textContent = compare ? formatPrice(compare) : '';
      compareEl.classList.toggle('hidden', !compare);
    }
    const pct = savingsPercent(variant.price, variant.compare_at_price);
    if (savingsEl) {
      savingsEl.textContent = pct ? `Save ${pct}%` : '';
      savingsEl.classList.toggle('hidden', !pct);
    }
    if (stockEl) {
      stockEl.textContent = out ? 'Out of Stock' : 'In Stock';
      stockEl.style.background = out ? '#fee2e2' : 'rgba(168,130,61,.15)';
      stockEl.style.color = out ? '#991b1b' : 'var(--gold-deep)';
    }
    if (sizeLabel && sizeIdx >= 0) sizeLabel.textContent = variant[`option${sizeIdx + 1}`] ?? '';
    panel.querySelectorAll('[data-size]').forEach((btn) => {
      const on = sizeIdx >= 0 && btn.dataset.size === variant[`option${sizeIdx + 1}`];
      btn.setAttribute('aria-pressed', String(on));
      btn.style.borderColor = on ? 'var(--black)' : 'rgba(43,38,32,.3)';
      btn.style.background = on ? 'var(--black)' : '';
      btn.style.color = on ? 'var(--ivory)' : '';
    });
    if (availableBlock) availableBlock.classList.toggle('hidden', out);
    if (soldOutBlock) soldOutBlock.classList.toggle('hidden', !out);
    if (qtyInput) {
      const max = maxQtyFor(stock, variant.id);
      qtyInput.max = String(max);
      qtyInput.value = String(clampQty(qtyInput.value, max));
    }
    const addLabel = addBtn?.querySelector('span');
    if (addLabel && !busy) addLabel.textContent = `Add to Bag | ${formatPrice(variant.price)}`;
  };

  const setBusy = (state, which) => {
    busy = state;
    if (addBtn) addBtn.disabled = state;
    if (buyBtn) buyBtn.disabled = state;
    const addLabel = addBtn?.querySelector('span');
    const buyLabel = buyBtn?.querySelector('span');
    if (addLabel) addLabel.textContent = state && which === 'add' ? 'Adding…' : `Add to Bag | ${formatPrice(variant.price)}`;
    if (buyLabel) buyLabel.textContent = state && which === 'buy' ? 'Redirecting…' : 'Buy Now | Instant Checkout';
  };

  const qty = () => clampQty(qtyInput?.value ?? 1, maxQtyFor(stock, variant?.id));

  // Buy Now leaves the buttons busy while the browser navigates to checkout.
  // If the shopper comes Back and the page is restored from the back/forward
  // cache, that frozen state would leave both buttons dead — reset it.
  window.addEventListener('pageshow', (e) => {
    if (isBfcacheRestore(e)) setBusy(false);
  });

  async function add(which) {
    if (!variant || !variant.available || busy) return;
    setBusy(true, which);
    try {
      await store.add(variant.id, qty(), { open: which === 'add' });
      if (which === 'buy') {
        window.location.href = '/checkout';
        return; // keep the buttons busy while the browser navigates
      }
    } catch (err) {
      notify(err instanceof CartError ? err.description : which === 'buy' ? MESSAGES.checkoutFailed : MESSAGES.addFailed);
    }
    setBusy(false);
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      add('add');
    });
  }

  panel.addEventListener('click', async (e) => {
    const size = e.target.closest('[data-size]');
    if (size) {
      variant = selectVariant(product, { size: size.dataset.size });
      paint();
      window.history.replaceState(window.history.state, '', variantUrl(window.location.href, variant.id));
      return;
    }
    const step = e.target.closest('[data-qty-step]');
    if (step && qtyInput) {
      qtyInput.value = String(clampQty(qty() + Number(step.dataset.qtyStep), maxQtyFor(stock, variant?.id)));
      return;
    }
    if (e.target.closest('[data-buy-now]')) return add('buy');
    if (e.target.closest('[data-bulk-inquiry]')) {
      const url = bulkInquiryUrl(settings.whatsappNumber, product.title, window.location.href);
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (e.target.closest('[data-share]')) {
      const url = window.location.href;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url });
        else {
          await navigator.clipboard.writeText(url);
          notify('Link copied to clipboard.', 'success');
        }
      } catch {
        /* share sheet dismissed — nothing to do */
      }
      return;
    }
    if (e.target.closest('[data-notify-open]')) {
      document.dispatchEvent(
        new CustomEvent('elaraa:notify:open', {
          detail: { title: product.title, variant: variant?.title, variantId: variant?.id },
        })
      );
    }
  });

  if (qtyInput) qtyInput.addEventListener('change', () => (qtyInput.value = String(qty())));

  const pinForm = $('[data-pincode-form]');
  if (pinForm) {
    const input = pinForm.querySelector('[data-pincode-input]');
    const ok = pinForm.querySelector('[data-pincode-valid]');
    const bad = pinForm.querySelector('[data-pincode-invalid]');
    input.addEventListener('input', () => (input.value = input.value.replace(/\D/g, '').slice(0, 6)));
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const valid = isValidPincode(input.value);
      if (ok) {
        ok.textContent = valid ? `✓ ${pincodeMessage(settings.pincodeSuccessCopy, input.value.trim())}` : '';
        ok.classList.toggle('hidden', !valid);
      }
      if (bad) bad.classList.toggle('hidden', valid);
    });
  }

  paint();
}

export function initPurchasePanels(store, settings = {}, scope = document) {
  scope.querySelectorAll('[data-purchase-panel]').forEach((panel) => bind(panel, store, settings));
}

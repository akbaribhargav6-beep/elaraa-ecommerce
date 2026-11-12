// Cart page behaviour (ports frontend/src/app/cart/page.tsx). The markup in
// sections/main-cart.liquid is server-rendered; after every cart change the
// section is re-fetched through the Section Rendering API so totals, the
// free-shipping bar, discounts and the upsell are always Shopify's own numbers.
import { notify, MESSAGES } from './toast.mjs';
import { CartError } from './cart.mjs';

const HARD_MAX_QTY = 99;

export function normalizeCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

/** Fallback when the Cart API cannot apply a code: Shopify's own /discount/<CODE> route. */
export function applyDiscountUrl(code, redirect = '/cart') {
  return `/discount/${encodeURIComponent(normalizeCode(code))}?redirect=${encodeURIComponent(redirect)}`;
}

/**
 * Reads Shopify's verdict on a code from the cart JSON returned by
 * /cart/update.js { discount }: 'applied', 'not-applicable', or 'unknown'
 * when the cart JSON has no discount_codes (caller then uses applyDiscountUrl).
 */
export function discountOutcome(cart, code) {
  if (!cart || !Array.isArray(cart.discount_codes)) return 'unknown';
  const wanted = normalizeCode(code);
  const hit = cart.discount_codes.find((d) => normalizeCode(d.code) === wanted);
  return hit && hit.applicable ? 'applied' : 'not-applicable';
}

/** Codes Shopify currently honours on this cart (from the cart JSON). */
export function applicableCodes(cart) {
  if (!cart || !Array.isArray(cart.discount_codes)) return [];
  return cart.discount_codes.filter((d) => d.applicable).map((d) => normalizeCode(d.code));
}

/**
 * The Cart API's `discount` parameter REPLACES the whole list of codes, so a
 * new code is posted together with the ones already applied — otherwise a
 * typo would silently drop a working discount.
 */
export function discountList(existing, newCode) {
  const list = existing.map(normalizeCode).filter(Boolean);
  const code = normalizeCode(newCode);
  if (code && !list.includes(code)) list.push(code);
  return list.join(',');
}

/** Quantity after a ± step. The stepper never goes below 1 — Remove deletes a line. */
export function nextLineQty(current, step, max) {
  const ceiling = Number.isFinite(Number(max)) && Number(max) > 0 ? Math.min(HARD_MAX_QTY, Number(max)) : HARD_MAX_QTY;
  return Math.min(ceiling, Math.max(1, Number(current) + Number(step)));
}

export function cartSectionUrl(cartRoute, sectionId) {
  return `${cartRoute}?section_id=${encodeURIComponent(sectionId)}`;
}

export function initCartPage(store, routes = {}) {
  if (document.body.dataset.cartPageBound === '1') return;
  if (!document.querySelector('[data-cart-root]')) return;
  document.body.dataset.cartPageBound = '1';

  const cartRoute = routes.cart || '/cart';
  const updateRoute = `${routes.cartUpdate || '/cart/update'}.js`;
  let requestId = 0;
  let couponNote = null; // { text, ok } — survives the section re-render

  const root = () => document.querySelector('[data-cart-root]');

  const paintCouponNote = () => {
    const el = root()?.querySelector('[data-coupon-message]');
    if (!el) return;
    el.textContent = couponNote ? couponNote.text : '';
    el.style.color = couponNote?.ok ? '#047857' : '#b91c1c';
    el.classList.toggle('hidden', !couponNote);
  };

  async function refresh() {
    const current = root();
    if (!current) return;
    const id = ++requestId;
    try {
      const res = await fetch(cartSectionUrl(cartRoute, current.dataset.sectionId), { headers: { Accept: 'text/html' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const next = doc.querySelector('[data-cart-root]');
      if (!next || id !== requestId) return;
      const live = root();
      if (!live) return;
      const focusKey = document.activeElement?.closest?.('[data-focus-key]')?.dataset.focusKey;
      const typed = live.querySelector('[data-coupon-input]')?.value;
      live.replaceWith(next);
      const input = next.querySelector('[data-coupon-input]');
      if (input && typed && !couponNote?.ok) input.value = typed;
      if (focusKey) {
        const target = [...next.querySelectorAll('[data-focus-key]')].find((el) => el.dataset.focusKey === focusKey);
        if (target) target.focus({ preventScroll: true });
      }
      paintCouponNote();
      next.dispatchEvent(new CustomEvent('elaraa:section:replaced', { bubbles: true }));
    } catch {
      window.location.reload();
    }
  }

  document.addEventListener('elaraa:cart:updated', refresh);

  // A bag that holds only the ₹99 gift-packaging add-on would read "empty"
  // while the header badge says 1: drop the add-on along with the last piece.
  const dropOrphanGift = () => {
    const marker = root()?.querySelector('[data-orphan-gift]');
    if (marker && marker.dataset.orphanGift) store.remove(marker.dataset.orphanGift).catch(() => {});
  };
  document.addEventListener('elaraa:section:replaced', dropOrphanGift);
  dropOrphanGift();

  const fail = (err, fallback) => notify(err instanceof CartError ? err.description : fallback);

  document.addEventListener('click', async (e) => {
    const r = root();
    if (!r || !r.contains(e.target)) return;

    const step = e.target.closest('[data-line-step]');
    if (step) {
      const row = step.closest('[data-line-key]');
      const current = Number(row.dataset.lineQty);
      const next = nextLineQty(current, step.dataset.lineStep, row.dataset.lineMax);
      if (next === current) return;
      try {
        await store.change(row.dataset.lineKey, next);
      } catch (err) {
        fail(err, MESSAGES.updateFailed);
      }
      return;
    }

    const remove = e.target.closest('[data-line-remove]');
    if (remove) {
      try {
        await store.remove(remove.closest('[data-line-key]').dataset.lineKey);
      } catch (err) {
        fail(err, MESSAGES.removeFailed);
      }
    }
  });

  document.addEventListener('change', async (e) => {
    const r = root();
    if (!r || !r.contains(e.target)) return;
    const gift = e.target.closest('[data-gift-toggle]');
    if (!gift) return;
    gift.disabled = true;
    try {
      if (gift.checked) await store.add(Number(gift.dataset.variantId), 1, { open: false });
      else if (gift.dataset.lineKey) await store.remove(gift.dataset.lineKey);
    } catch (err) {
      gift.checked = !gift.checked;
      gift.disabled = false;
      fail(err, MESSAGES.updateFailed);
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest?.('[data-coupon-form]');
    if (!form || !root()?.contains(form)) return;
    e.preventDefault();
    const input = form.querySelector('[data-coupon-input]');
    const button = form.querySelector('button[type="submit"]');
    const label = button?.querySelector('span');
    const code = normalizeCode(input?.value);
    if (!code) return;
    if (button) button.disabled = true;
    if (label) label.textContent = '…';
    const post = (discount) =>
      fetch(updateRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ discount }),
      });
    try {
      const existing = applicableCodes(store.current());
      const res = await post(discountList(existing, code));
      const cart = res.ok ? await res.json() : null;
      const outcome = discountOutcome(cart, code);
      if (outcome === 'unknown') {
        // This store's Cart API does not report discount codes: let Shopify's
        // /discount route attach the code and bring the shopper back.
        window.location.assign(applyDiscountUrl(code, cartRoute));
        return;
      }
      if (outcome === 'not-applicable' && existing.length > 0) {
        // Put the working codes back exactly as they were before the typo.
        await post(discountList(existing, ''));
      }
      couponNote =
        outcome === 'applied'
          ? { ok: true, text: `Code ${code} applied.` }
          : { ok: false, text: "This code isn't valid for your bag." };
      await store.refresh(); // emits elaraa:cart:updated → re-render with the discount row
    } catch {
      couponNote = { ok: false, text: 'Something went wrong, please try again.' };
      paintCouponNote();
    } finally {
      const liveButton = root()?.querySelector('[data-coupon-form] button[type="submit"]');
      if (liveButton) {
        liveButton.disabled = false;
        const liveLabel = liveButton.querySelector('span');
        if (liveLabel) liveLabel.textContent = 'Apply';
      }
    }
  });
}

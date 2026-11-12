// Mini cart drawer (ports frontend/src/components/layout/CartDrawer.tsx).
// Markup is server-rendered in snippets/cart-drawer.liquid; this module
// re-renders the item list from the Ajax cart JSON after every change.
import { formatPrice } from './money.mjs';
import { notify, MESSAGES } from './toast.mjs';
import { CartError } from './cart.mjs';

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function imageUrl(url, width = 152) {
  if (!url) return '';
  return url.replace(/(\.[a-zA-Z]+)(\?.*)?$/, `_${width}x$1$2`);
}

export function renderItem(item) {
  const variant = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
  return `
    <div class="cart-drawer-item" data-line-key="${escapeHtml(item.key)}">
      ${item.image ? `<img src="${escapeHtml(imageUrl(item.image))}" alt="${escapeHtml(item.product_title)}" width="76" height="76" class="object-cover" loading="lazy">` : ''}
      <div class="flex-1">
        <h4 class="serif text-base"><a href="${escapeHtml(item.url)}">${escapeHtml(item.product_title)}</a></h4>
        ${variant ? `<p class="text-xs opacity-60 mt-1">${escapeHtml(variant)}</p>` : ''}
        <div class="flex items-center justify-between mt-2">
          <div class="qty-box">
            <button type="button" data-qty-change="-1" aria-label="Decrease quantity">−</button>
            <input type="number" value="${item.quantity}" readonly aria-label="Quantity">
            <button type="button" data-qty-change="1" aria-label="Increase quantity">+</button>
          </div>
          <p class="text-xs">${formatPrice(item.final_line_price)}</p>
        </div>
        <button type="button" data-line-remove class="text-[10px] tracking-[.15em] uppercase opacity-50 hover:opacity-100 mt-2">Remove</button>
      </div>
    </div>`;
}

export function renderDrawer(root, cart) {
  const list = root.querySelector('[data-drawer-items]');
  const subtotal = root.querySelector('[data-drawer-subtotal]');
  const total = root.querySelector('[data-drawer-products-total]');
  if (list) {
    list.innerHTML = cart.items?.length
      ? cart.items.map(renderItem).join('')
      : '<p class="text-sm opacity-60 py-10 text-center">Your bag is empty.</p>';
  }
  if (total) total.textContent = formatPrice(cart.items_subtotal_price ?? cart.total_price ?? 0);
  if (subtotal) subtotal.textContent = formatPrice(cart.total_price ?? 0);
}

export function initCartDrawer(store) {
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (!overlay || !drawer || drawer.dataset.bound === '1') return;
  drawer.dataset.bound = '1';

  const setOpen = (open) => {
    overlay.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  overlay.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) setOpen(false);
  });
  document.addEventListener('elaraa:cart:open', () => setOpen(true));
  document.addEventListener('elaraa:cart:updated', (e) => renderDrawer(drawer, e.detail));

  drawer.addEventListener('click', async (e) => {
    const row = e.target.closest('[data-line-key]');
    if (!row) return;
    const key = row.dataset.lineKey;
    const current = store.current()?.items?.find((i) => i.key === key);
    if (!current) return;
    const stepBtn = e.target.closest('[data-qty-change]');
    const removeBtn = e.target.closest('[data-line-remove]');
    try {
      if (stepBtn) {
        const next = current.quantity + Number(stepBtn.dataset.qtyChange);
        if (next < 1) return;
        await store.change(key, next);
      } else if (removeBtn) {
        await store.remove(key);
      }
    } catch (err) {
      notify(err instanceof CartError ? err.description : removeBtn ? MESSAGES.removeFailed : MESSAGES.updateFailed);
    }
  });

  if (store.current()) renderDrawer(drawer, store.current());
}

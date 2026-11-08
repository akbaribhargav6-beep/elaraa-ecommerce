// Quick View modal (ports frontend/src/components/product/QuickViewModal.tsx).
// Pure helpers are unit-tested; the DOM part fills snippets/quick-view.liquid
// from the product .js endpoint.
import { formatPrice } from './money.mjs';
import { notify, MESSAGES } from './toast.mjs';
import { CartError } from './cart.mjs';

export function productJsonUrl(handle, root = '') {
  const base = root && root !== '/' ? root.replace(/\/$/, '') : '';
  return `${base}/products/${handle}.js`;
}

/** Index of the "Size" option (options may be strings or {name, position}). */
export function sizeOptionIndex(product) {
  const options = product?.options ?? [];
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    const name = typeof o === 'string' ? o : o?.name;
    if (String(name).toLowerCase() === 'size') return typeof o === 'object' && o?.position ? o.position - 1 : i;
  }
  return -1;
}

export function selectVariant(product, { size } = {}) {
  const variants = product?.variants ?? [];
  if (variants.length === 0) return null;
  const idx = sizeOptionIndex(product);
  if (size != null && idx >= 0) {
    const match = variants.find((v) => v[`option${idx + 1}`] === String(size));
    if (match) return match;
  }
  return variants.find((v) => v.available) ?? variants[0];
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function sized(url, width) {
  return url ? url.replace(/(\.[a-zA-Z]+)(\?.*)?$/, `_${width}x$1$2`) : '';
}

function renderProduct(product, meta, state) {
  const variant = selectVariant(product, { size: state.size });
  const idx = sizeOptionIndex(product);
  const sizes = idx >= 0 ? [...new Set(product.variants.map((v) => v[`option${idx + 1}`]))] : [];
  const image = product.featured_image || product.images?.[0] || '';
  const outOfStock = !variant || !variant.available;
  const compareAt = variant?.compare_at_price && variant.compare_at_price > variant.price ? variant.compare_at_price : null;

  return `
    <div class="relative aspect-square bg-stone-100">
      ${image ? `<img src="${escapeHtml(sized(image, 800))}" alt="${escapeHtml(product.title)}" class="absolute inset-0 w-full h-full object-cover">` : ''}
    </div>
    <div class="p-6 sm:p-8 flex flex-col">
      ${meta.eyebrow ? `<p class="eyebrow">${escapeHtml(meta.eyebrow)}</p>` : ''}
      <h2 class="serif text-2xl sm:text-3xl mt-2">${escapeHtml(product.title)}</h2>
      <p class="text-lg mt-3">
        <span data-qv-price>${formatPrice(variant?.price ?? product.price)}</span>
        ${compareAt ? `<span class="text-sm opacity-50 line-through ml-2">${formatPrice(compareAt)}</span>` : ''}
      </p>
      ${meta.shortDescription ? `<p class="text-sm opacity-70 mt-3 leading-relaxed">${escapeHtml(meta.shortDescription)}</p>` : ''}
      ${
        meta.metalFinish
          ? `<div class="mt-5">
              <p class="text-xs tracking-[.2em] uppercase opacity-60 mb-2">Finish: <span class="opacity-100">${escapeHtml(meta.metalFinish)}</span></p>
              <div class="flex gap-2.5">
                <button type="button" class="w-8 h-8 rounded-full border-2" style="background:${escapeHtml(meta.metalHex || '#C9A66B')};border-color:var(--black)" aria-label="${escapeHtml(meta.metalFinish)}" aria-pressed="true"></button>
              </div>
            </div>`
          : ''
      }
      ${
        sizes.length
          ? `<div class="mt-5">
              <p class="text-xs tracking-[.2em] uppercase opacity-60 mb-2">Size: <span class="opacity-100">${escapeHtml(variant?.[`option${idx + 1}`] ?? '')}</span></p>
              <div class="grid grid-cols-4 gap-2">
                ${sizes
                  .map((s) => {
                    const active = variant && variant[`option${idx + 1}`] === s;
                    return `<button type="button" data-qv-size="${escapeHtml(s)}" class="py-2 px-3 text-xs tracking-wider border font-medium transition-colors" style="${active ? 'border-color:var(--black);background:var(--black);color:var(--ivory)' : 'border-color:rgba(43,38,32,.3)'}">${escapeHtml(s)}</button>`;
                  })
                  .join('')}
              </div>
            </div>`
          : ''
      }
      <div class="flex items-center gap-4 mt-6">
        <div class="qty-box">
          <button type="button" data-qv-qty="-1" aria-label="Decrease quantity">−</button>
          <input type="number" data-qv-qty-input value="${state.qty}" min="1" max="99" aria-label="Quantity">
          <button type="button" data-qv-qty="1" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" data-qv-add data-variant-id="${variant?.id ?? ''}" class="btn-luxury btn-gold-solid flex-1 justify-center" ${outOfStock ? 'disabled' : ''}>
          <span>${outOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
        </button>
      </div>
      <a href="${escapeHtml(product.url || `/products/${product.handle}`)}" class="text-xs tracking-[.15em] uppercase opacity-60 hover:opacity-100 mt-4 text-center">View Full Details →</a>
    </div>`;
}

export function initQuickView(store, { routes } = {}) {
  const overlay = document.getElementById('quickView');
  if (!overlay || overlay.dataset.bound === '1') return null;
  overlay.dataset.bound = '1';
  const content = overlay.querySelector('[data-qv-content]');
  const root = routes?.root && routes.root !== '/' ? routes.root : '';

  let product = null;
  let meta = {};
  let state = { size: null, qty: 1 };
  let requestId = 0;

  const close = () => {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    product = null;
    content.innerHTML = '';
  };

  const paint = () => {
    if (product) content.innerHTML = renderProduct(product, meta, state);
  };

  const load = async (handle) => {
    const id = ++requestId;
    content.innerHTML = '<div class="sm:col-span-2 p-16 text-center text-sm opacity-60">Loading…</div>';
    try {
      const res = await fetch(productJsonUrl(handle, root), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (id !== requestId) return;
      product = data;
      state = { size: null, qty: 1 };
      paint();
    } catch {
      if (id !== requestId) return;
      content.innerHTML = `<div class="sm:col-span-2 p-16 text-center text-sm space-y-4"><p class="opacity-60">Couldn't load this product.</p><button type="button" data-qv-retry="${escapeHtml(handle)}" class="btn-luxury btn-gold text-xs px-5 py-2 inline-flex"><span>Try Again</span></button></div>`;
    }
  };

  const open = (handle, nextMeta = {}) => {
    meta = nextMeta;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    load(handle);
  };

  overlay.addEventListener('click', async (e) => {
    if (e.target === overlay || e.target.closest('[data-qv-close]')) return close();
    const retry = e.target.closest('[data-qv-retry]');
    if (retry) return load(retry.dataset.qvRetry);
    const sizeBtn = e.target.closest('[data-qv-size]');
    if (sizeBtn) {
      state.size = sizeBtn.dataset.qvSize;
      return paint();
    }
    const qtyBtn = e.target.closest('[data-qv-qty]');
    if (qtyBtn) {
      state.qty = Math.min(99, Math.max(1, state.qty + Number(qtyBtn.dataset.qvQty)));
      const input = overlay.querySelector('[data-qv-qty-input]');
      if (input) input.value = String(state.qty);
      return;
    }
    const addBtn = e.target.closest('[data-qv-add]');
    if (addBtn && !addBtn.disabled) {
      const variantId = Number(addBtn.dataset.variantId);
      const label = addBtn.querySelector('span');
      addBtn.disabled = true;
      if (label) label.textContent = 'Adding…';
      try {
        await store.add(variantId, state.qty);
        close();
      } catch (err) {
        notify(err instanceof CartError ? err.description : MESSAGES.addFailed);
        addBtn.disabled = false;
        if (label) label.textContent = 'Add to Bag';
      }
    }
  });
  overlay.addEventListener('input', (e) => {
    if (e.target.matches('[data-qv-qty-input]')) {
      const n = parseInt(e.target.value, 10);
      if (!Number.isNaN(n)) state.qty = Math.min(99, Math.max(1, n));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) close();
  });

  return { open, close };
}

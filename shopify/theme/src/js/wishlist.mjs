// Wishlist without a login: product handles in localStorage (spec decision —
// Shopify has no native wishlist). Degrades to an in-memory list when
// storage is blocked. Hearts on cards / product pages carry
// data-wishlist-toggle="<handle>"; the wishlist page renders the list.
import { formatPrice } from './money.mjs';
import { productJsonUrl } from './quick-view.mjs';

export const STORAGE_KEY = 'elaraa:wishlist';
export const EVENT = 'elaraa:wishlist:updated';

function safeStorage(storage) {
  try {
    if (!storage) return null;
    // Access both accessors once; private mode / blocked storage throws here.
    void storage.getItem;
    void storage.setItem;
    return storage;
  } catch {
    return null;
  }
}

function read(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((h) => typeof h === 'string' && h.length > 0))];
  } catch {
    return [];
  }
}

function resolveStorage(opts) {
  // Even *reading* window.localStorage throws when site data is blocked, so
  // the lookup has to happen inside a try — never in a default parameter.
  try {
    return 'storage' in opts ? opts.storage : globalThis.localStorage;
  } catch {
    return null;
  }
}

export function createWishlist(opts = {}) {
  const { onChange } = opts;
  const store = safeStorage(resolveStorage(opts));
  let handles = read(store);
  const persist = () => {
    try {
      store?.setItem(STORAGE_KEY, JSON.stringify(handles));
    } catch {
      /* in-memory only */
    }
    if (onChange) onChange(handles);
  };
  return {
    has: (handle) => handles.includes(handle),
    list: () => [...handles],
    toggle(handle) {
      const next = !handles.includes(handle);
      handles = next ? [...handles, handle] : handles.filter((h) => h !== handle);
      persist();
      return next;
    },
    remove(handle) {
      if (!handles.includes(handle)) return;
      handles = handles.filter((h) => h !== handle);
      persist();
    },
  };
}

function paintHearts(wishlist, root = document) {
  root.querySelectorAll('[data-wishlist-toggle]').forEach((btn) => {
    const on = wishlist.has(btn.dataset.wishlistToggle);
    btn.textContent = on ? '♥' : '♡';
    btn.style.color = on ? '#dc2626' : btn.dataset.wishlistIdle || '#2B2620';
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Remove from wishlist' : 'Add to wishlist');
    const label = btn.querySelector('[data-wishlist-label]');
    if (label) label.textContent = on ? 'In Your Wishlist' : 'Add to Wishlist';
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function sized(url, width) {
  return url ? url.replace(/(\.[a-zA-Z]+)(\?.*)?$/, `_${width}x$1$2`) : '';
}

async function renderWishlistPage(wishlist, root, routes) {
  const grid = root.querySelector('[data-wishlist-grid]');
  const empty = root.querySelector('[data-wishlist-empty]');
  if (!grid || !empty) return;
  const handles = wishlist.list();
  empty.classList.toggle('hidden', handles.length > 0);
  if (handles.length === 0) {
    grid.innerHTML = '';
    return;
  }
  const base = routes?.root && routes.root !== '/' ? routes.root : '';
  const products = await Promise.all(
    handles.map(async (handle) => {
      try {
        const res = await fetch(productJsonUrl(handle, base), { headers: { Accept: 'application/json' } });
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    })
  );
  grid.innerHTML = products
    .map((p, i) => {
      const handle = handles[i];
      if (!p) {
        return `<div class="flex gap-4 border p-4" style="border-color: rgba(43,38,32,.12)"><div class="flex-1"><p class="serif text-lg opacity-60">This piece is no longer available.</p><button type="button" data-wishlist-remove="${escapeHtml(handle)}" class="text-[10px] tracking-[.15em] uppercase opacity-50 hover:opacity-100 mt-2">Remove</button></div></div>`;
      }
      const image = p.featured_image || p.images?.[0];
      return `
        <div class="flex gap-4 border p-4" style="border-color: rgba(43,38,32,.12)">
          ${image ? `<a href="${escapeHtml(p.url)}"><img src="${escapeHtml(sized(image, 160))}" alt="${escapeHtml(p.title)}" width="80" height="80" class="object-cover flex-shrink-0" loading="lazy"></a>` : ''}
          <div class="flex-1">
            <a href="${escapeHtml(p.url)}" class="serif text-lg hover:opacity-70">${escapeHtml(p.title)}</a>
            <p class="text-sm mt-1">${formatPrice(p.price)}</p>
            ${p.available ? '' : '<p class="text-xs opacity-50 mt-1">Out of stock</p>'}
            <button type="button" data-wishlist-remove="${escapeHtml(handle)}" class="text-[10px] tracking-[.15em] uppercase opacity-50 hover:opacity-100 mt-2">Remove</button>
          </div>
        </div>`;
    })
    .join('');
}

export function initWishlist({ routes } = {}) {
  if (document.body.dataset.wishlistBound === '1') return null;
  document.body.dataset.wishlistBound = '1';
  const wishlist = createWishlist({
    onChange: (list) => document.dispatchEvent(new CustomEvent(EVENT, { detail: list })),
  });

  paintHearts(wishlist);
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-wishlist-toggle]');
    if (toggle) {
      e.preventDefault();
      wishlist.toggle(toggle.dataset.wishlistToggle);
      return;
    }
    const remove = e.target.closest('[data-wishlist-remove]');
    if (remove) {
      e.preventDefault();
      wishlist.remove(remove.dataset.wishlistRemove);
    }
  });
  document.addEventListener(EVENT, () => {
    paintHearts(wishlist);
    const page = document.querySelector('[data-wishlist-page]');
    if (page) renderWishlistPage(wishlist, page, routes);
  });
  document.addEventListener('shopify:section:load', (e) => paintHearts(wishlist, e.target));

  const page = document.querySelector('[data-wishlist-page]');
  if (page) renderWishlistPage(wishlist, page, routes);
  return wishlist;
}

// Header behaviour ported from Header.tsx + HeaderSearch.tsx: mobile drawer,
// instant search popover against the Predictive Search API, bag badge.
import { buildSuggestUrl, parsePredictiveProducts, MIN_QUERY_LENGTH, RESULT_LIMIT } from './search.mjs';
import { formatPrice } from './money.mjs';

const DEBOUNCE_MS = 300;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function lockBody(locked) {
  document.body.style.overflow = locked ? 'hidden' : '';
}

function initMobileMenu(root) {
  const openBtn = root.querySelector('[data-menu-open]');
  const drawer = root.querySelector('[data-mobile-drawer]');
  const backdrop = root.querySelector('[data-mobile-backdrop]');
  if (!openBtn || !drawer || !backdrop) return;
  const closeBtns = root.querySelectorAll('[data-menu-close]');
  const set = (open) => {
    drawer.classList.toggle('translate-x-0', open);
    drawer.classList.toggle('-translate-x-full', !open);
    backdrop.classList.toggle('opacity-100', open);
    backdrop.classList.toggle('opacity-0', !open);
    backdrop.classList.toggle('pointer-events-none', !open);
    openBtn.setAttribute('aria-expanded', String(open));
    lockBody(open);
  };
  openBtn.addEventListener('click', () => set(true));
  backdrop.addEventListener('click', () => set(false));
  closeBtns.forEach((b) => b.addEventListener('click', () => set(false)));
  drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('translate-x-0')) set(false);
  });
}

function renderResults(list, items, query, searchUrl) {
  if (items.length === 0) {
    list.innerHTML = `<p class="p-4 text-xs opacity-60">No products found for &ldquo;${escapeHtml(query)}&rdquo;.</p>`;
    return;
  }
  const rows = items
    .map(
      (p) => `
      <a href="${escapeHtml(p.url)}" class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--cream)] transition-colors">
        <div class="relative w-12 h-12 shrink-0 bg-[var(--cream)] overflow-hidden rounded-sm">
          ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt)}" width="48" height="48" class="w-full h-full object-cover" loading="lazy">` : ''}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm truncate">${escapeHtml(p.title)}</p>
          <p class="text-xs opacity-60 capitalize">${escapeHtml(p.type)}${p.available ? '' : ' · Sold out'}</p>
        </div>
        <p class="text-xs font-medium shrink-0">${formatPrice(p.priceCents)}</p>
      </a>`
    )
    .join('');
  const viewAll = `<a href="${searchUrl}?q=${encodeURIComponent(query)}&type=product" class="block text-center text-xs uppercase tracking-widest py-3 border-t hover:opacity-70" style="border-color: rgba(43,38,32,.1); color: var(--gold-deep)">View All Results →</a>`;
  list.innerHTML = rows + viewAll;
}

function initSearch(root, routes) {
  const toggle = root.querySelector('[data-search-toggle]');
  const panel = root.querySelector('[data-search-panel]');
  const input = root.querySelector('[data-search-input]');
  const list = root.querySelector('[data-search-results]');
  const iconOpen = root.querySelector('[data-search-icon="open"]');
  const iconClose = root.querySelector('[data-search-icon="close"]');
  if (!toggle || !panel || !input || !list) return;

  const suggestBase = routes?.predictiveSearch || '/search/suggest.json';
  const searchUrl = routes?.search || '/search';
  let open = false;
  let timer = null;
  let requestId = 0;

  const setOpen = (next) => {
    open = next;
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close search' : 'Search');
    if (iconOpen) iconOpen.classList.toggle('hidden', open);
    if (iconClose) iconClose.classList.toggle('hidden', !open);
    if (open) {
      const nav = document.querySelector('.nav-fixed');
      if (nav) panel.style.top = `${nav.getBoundingClientRect().bottom + 8}px`;
      requestAnimationFrame(() => input.focus());
    } else {
      input.value = '';
      list.innerHTML = '';
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  document.addEventListener('pointerdown', (e) => {
    if (open && !root.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim().length >= MIN_QUERY_LENGTH) {
      window.location.href = `${searchUrl}?q=${encodeURIComponent(input.value.trim())}&type=product`;
    }
  });

  input.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    const q = input.value.trim();
    if (q.length === 0) {
      list.innerHTML = '';
      return;
    }
    if (q.length < MIN_QUERY_LENGTH) {
      list.innerHTML = '<p class="p-4 text-xs opacity-40">Keep typing…</p>';
      return;
    }
    list.innerHTML = '<p class="p-4 text-xs opacity-60">Searching…</p>';
    const id = ++requestId;
    timer = setTimeout(async () => {
      try {
        const res = await fetch(buildSuggestUrl(q, RESULT_LIMIT, suggestBase), { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = parsePredictiveProducts(await res.json());
        if (id === requestId) renderResults(list, items, q, searchUrl);
      } catch {
        if (id === requestId) list.innerHTML = '<p class="p-4 text-xs opacity-60">Search is unavailable right now.</p>';
      }
    }, DEBOUNCE_MS);
  });
}

function initCartBadge(root) {
  const badges = root.querySelectorAll('[data-cart-count]');
  const bagButtons = root.querySelectorAll('[data-cart-open]');
  const render = (count) => {
    badges.forEach((el) => {
      el.textContent = count > 9 ? '9+' : String(count);
      el.classList.toggle('hidden', count <= 0);
    });
    bagButtons.forEach((b) => b.setAttribute('aria-label', `Shopping bag${count > 0 ? `, ${count} items` : ''}`));
  };
  document.addEventListener('elaraa:cart:updated', (e) => render(e.detail?.item_count ?? 0));
  bagButtons.forEach((b) =>
    b.addEventListener('click', () => document.dispatchEvent(new CustomEvent('elaraa:cart:open')))
  );
}

export function initHeader(routes = window.ELARAA?.routes) {
  const root = document.querySelector('[data-elaraa-header]');
  if (!root || root.dataset.bound === '1') return;
  root.dataset.bound = '1';
  initMobileMenu(root);
  initSearch(root, routes);
  initCartBadge(root);
}

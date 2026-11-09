// Shop / collection page behaviour (ports frontend/src/components/shop/ShopFilters.tsx).
// Filters, sort, category switches and pagination re-render the section via
// Shopify's Section Rendering API (?section_id=) instead of a full reload,
// like the React page's router.replace(). Pure URL helpers are unit-tested.

const PRICE_DEBOUNCE_MS = 250;

/**
 * @param {string} currentUrl absolute URL
 * @param {Record<string, string|undefined|{add?: string, remove?: string}>} updates
 *   string → set, '' / undefined → delete, {add}/{remove} → toggle one value of a multi-value param
 */
export function buildFilterUrl(currentUrl, updates) {
  const url = new URL(currentUrl);
  for (const [key, value] of Object.entries(updates)) {
    if (value && typeof value === 'object') {
      const current = url.searchParams.getAll(key);
      url.searchParams.delete(key);
      const next = value.remove ? current.filter((v) => v !== value.remove) : current;
      if (value.add && !next.includes(value.add)) next.push(value.add);
      next.forEach((v) => url.searchParams.append(key, v));
    } else if (value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  }
  url.searchParams.delete('page'); // any filter change resets pagination
  return url.toString();
}

/** Target collection URL carrying the active filter.* and sort_by params. */
export function carryFilters(targetPath, currentSearch, origin) {
  const url = new URL(targetPath, origin);
  const current = new URLSearchParams(currentSearch);
  for (const [key, value] of current.entries()) {
    if (key.startsWith('filter.') || key === 'sort_by') url.searchParams.append(key, value);
  }
  return url.toString();
}

/** Shopify price filters take currency units; at the ceiling the filter is dropped. */
export function priceParam(valueRupees, ceilingRupees) {
  const n = Number(valueRupees);
  return n >= Number(ceilingRupees) ? undefined : String(n);
}

/** Slider bounds in rupees from the collection's highest price (paise). */
export function sliderBounds(rangeMaxCents, floorRupees, step) {
  const max = Math.max(step, Math.ceil(Number(rangeMaxCents) / 100 / step) * step);
  let min = Number(floorRupees);
  if (min >= max) min = Math.max(0, max - step);
  return { min, max };
}

export function withSection(url, sectionId) {
  const u = new URL(url);
  u.searchParams.set('section_id', sectionId);
  return u.toString();
}

export function hasActiveFilters(pathname, search) {
  if (!/\/collections\/all\/?$/.test(pathname)) return true;
  for (const key of new URLSearchParams(search).keys()) if (key.startsWith('filter.')) return true;
  return false;
}

function inr(rupees) {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(rupees)}`;
}

export function initCollection() {
  if (document.body.dataset.collectionBound === '1') return;
  if (!document.querySelector('[data-collection-root]')) return;
  document.body.dataset.collectionBound = '1';

  let filtersOpen = false;
  let priceTimer = null;
  let requestId = 0;

  const root = () => document.querySelector('[data-collection-root]');

  const applyFiltersOpen = () => {
    const aside = root()?.querySelector('[data-filters-panel]');
    if (!aside) return;
    aside.classList.toggle('hidden', !filtersOpen);
    aside.classList.toggle('block', filtersOpen);
  };

  async function go(url, { history = 'replace', scroll = false } = {}) {
    const current = root();
    if (!current) return window.location.assign(url);
    const id = ++requestId;
    current.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(withSection(url, current.dataset.sectionId), { headers: { Accept: 'text/html' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const next = doc.querySelector('[data-collection-root]');
      if (!next) throw new Error('section missing');
      if (id !== requestId) return;
      current.replaceWith(next);
      if (history === 'push') window.history.pushState({ elaraaCollection: true }, '', url);
      else if (history === 'replace') window.history.replaceState({ elaraaCollection: true }, '', url);
      applyFiltersOpen();
      next.dispatchEvent(new CustomEvent('elaraa:section:replaced', { bubbles: true }));
      if (scroll) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      window.location.assign(url);
    }
  }

  document.addEventListener('change', (e) => {
    if (!root()?.contains(e.target)) return;
    const t = e.target;
    if (t.matches('[data-collection-sort]')) {
      return go(buildFilterUrl(window.location.href, { sort_by: t.value }));
    }
    if (t.matches('[data-category-url]')) {
      return go(carryFilters(t.dataset.categoryUrl, window.location.search, window.location.origin), { history: 'push' });
    }
    if (t.matches('[data-filter-param]')) {
      const update = t.checked ? { add: t.dataset.filterValue } : { remove: t.dataset.filterValue };
      return go(buildFilterUrl(window.location.href, { [t.dataset.filterParam]: update }));
    }
  });

  document.addEventListener('input', (e) => {
    const slider = e.target.closest?.('[data-price-slider]');
    if (!slider || !root()?.contains(slider)) return;
    const ceiling = Number(slider.max);
    const value = Number(slider.value);
    const label = root().querySelector('[data-price-label]');
    if (label) label.textContent = `Up to ${inr(Math.min(value, ceiling))}`;
    if (priceTimer) clearTimeout(priceTimer);
    priceTimer = setTimeout(() => {
      go(buildFilterUrl(window.location.href, { [slider.dataset.priceParam]: priceParam(value, ceiling) }));
    }, PRICE_DEBOUNCE_MS);
  });

  document.addEventListener('click', (e) => {
    const r = root();
    if (!r || !r.contains(e.target)) return;
    if (e.target.closest('[data-filters-toggle]')) {
      filtersOpen = !filtersOpen;
      return applyFiltersOpen();
    }
    const reset = e.target.closest('[data-filters-reset]');
    if (reset && !reset.disabled) {
      return go(new URL(r.dataset.allUrl, window.location.origin).toString(), { history: 'push' });
    }
    const page = e.target.closest('[data-pagination] a[href]');
    if (page && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      go(new URL(page.getAttribute('href'), window.location.origin).toString(), { history: 'push', scroll: true });
    }
  });

  window.addEventListener('popstate', () => {
    if (root()) go(window.location.href, { history: 'none' });
  });
}

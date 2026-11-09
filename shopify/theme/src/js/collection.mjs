// Shop / collection page behaviour (ports frontend/src/components/shop/ShopFilters.tsx).
// Filters, sort, category switches and pagination re-render through Shopify's
// Section Rendering API (?section_id=) instead of a full reload, like the
// React page's router.replace(). Pure URL helpers are unit-tested.
//
// Two swap modes:
//   partial – same collection (filter / sort / page): only the product list
//             and count are replaced, so the control being used (slider under
//             the finger, focused checkbox) stays mounted, as in React.
//   full    – another collection (category, reset, back/forward): the whole
//             section is replaced and focus is restored by data-focus-key.

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

/** All-products URL keeping only the sort (resetFilters in ShopFilters.tsx leaves `sort` alone). */
export function resetUrl(allPath, currentSearch, origin) {
  const url = new URL(allPath, origin);
  const sort = new URLSearchParams(currentSearch).get('sort_by');
  if (sort) url.searchParams.set('sort_by', sort);
  return url.toString();
}

/** Shopify price filters take currency units; at the ceiling the filter is dropped. */
export function priceParam(valueRupees, ceilingRupees) {
  const n = Number(valueRupees);
  return n >= Number(ceilingRupees) ? undefined : String(n);
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

const trimSlash = (p) => (p.length > 1 ? p.replace(/\/$/, '') : p);

/** 'partial' when the target is the collection already rendered, else 'full'. */
export function swapMode(targetUrl, renderedPath) {
  return trimSlash(new URL(targetUrl).pathname) === trimSlash(renderedPath) ? 'partial' : 'full';
}

/**
 * Tracks the URL of the request in flight so a second change made before the
 * first response returns is built on top of it (the address bar only updates
 * after the response).
 */
export function createUrlBase(getLocation) {
  let pending = null;
  let latest = 0;
  return {
    current: () => pending || getLocation(),
    begin(url) {
      pending = url;
      latest += 1;
      return latest;
    },
    isLatest: (id) => id === latest,
    settle(id) {
      if (id === latest) pending = null;
    },
  };
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
  const base = createUrlBase(() => window.location.href);

  const root = () => document.querySelector('[data-collection-root]');

  const applyFiltersOpen = () => {
    const aside = root()?.querySelector('[data-filters-panel]');
    if (!aside) return;
    aside.classList.toggle('hidden', !filtersOpen);
    aside.classList.toggle('block', filtersOpen);
  };

  function swapPartial(current, next) {
    for (const selector of ['[data-collection-items]', '[data-collection-count]']) {
      const from = next.querySelector(selector);
      const to = current.querySelector(selector);
      if (from && to) to.replaceWith(from);
    }
    const reset = current.querySelector('[data-filters-reset]');
    const nextReset = next.querySelector('[data-filters-reset]');
    if (reset && nextReset) reset.disabled = nextReset.disabled;
    return current;
  }

  function swapFull(current, next) {
    const focusKey = document.activeElement?.closest?.('[data-focus-key]')?.dataset.focusKey;
    current.replaceWith(next);
    applyFiltersOpen();
    if (focusKey) {
      const target = [...next.querySelectorAll('[data-focus-key]')].find((el) => el.dataset.focusKey === focusKey);
      if (target) target.focus({ preventScroll: true });
    }
    return next;
  }

  async function go(url, { history = 'replace', scroll = false, mode } = {}) {
    const current = root();
    if (!current) return window.location.assign(url);
    const id = base.begin(url);
    try {
      const res = await fetch(withSection(url, current.dataset.sectionId), { headers: { Accept: 'text/html' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const next = doc.querySelector('[data-collection-root]');
      if (!next) throw new Error('section missing');
      if (!base.isLatest(id)) return; // a newer change superseded this one
      const live = root();
      if (!live) return;
      const how = mode || swapMode(url, live.dataset.collectionUrl || window.location.pathname);
      const shown = how === 'partial' ? swapPartial(live, next) : swapFull(live, next);
      if (history === 'push') window.history.pushState({ elaraaCollection: true }, '', url);
      else if (history === 'replace') window.history.replaceState({ elaraaCollection: true }, '', url);
      shown.dispatchEvent(new CustomEvent('elaraa:section:replaced', { bubbles: true }));
      if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Only the newest request may fall back to a real navigation; back/forward
      // must not push a new history entry.
      if (base.isLatest(id)) {
        if (history === 'none') window.location.replace(url);
        else window.location.assign(url);
      }
    } finally {
      base.settle(id);
    }
  }

  document.addEventListener('change', (e) => {
    const r = root();
    if (!r || !r.contains(e.target)) return;
    const t = e.target;
    if (t.matches('[data-collection-sort]')) {
      return go(buildFilterUrl(base.current(), { sort_by: t.value }));
    }
    if (t.matches('[data-category-url]')) {
      const current = new URL(base.current());
      let url = carryFilters(t.dataset.categoryUrl, current.search, current.origin);
      // On /collections/new-arrivals (or best-sellers) the collection itself is
      // the "New Arrivals" filter; keep it as a tag filter when a category is picked.
      const curated = r.dataset.curatedTag;
      if (curated && r.dataset.tagParam && t.type === 'radio') {
        url = buildFilterUrl(url, { [r.dataset.tagParam]: { add: curated } });
      }
      return go(url, { history: 'push' });
    }
    if (t.matches('[data-filter-param]')) {
      const update = t.checked ? { add: t.dataset.filterValue } : { remove: t.dataset.filterValue };
      return go(buildFilterUrl(base.current(), { [t.dataset.filterParam]: update }));
    }
  });

  document.addEventListener('input', (e) => {
    const slider = e.target.closest?.('[data-price-slider]');
    const r = root();
    if (!slider || !r || !r.contains(slider)) return;
    const ceiling = Number(slider.max);
    const label = r.querySelector('[data-price-label]');
    if (label) label.textContent = `Up to ${inr(Math.min(Number(slider.value), ceiling))}`;
    if (priceTimer) clearTimeout(priceTimer);
    priceTimer = setTimeout(() => {
      // Read the live slider at fire time; a category switch may have replaced it.
      const live = root()?.querySelector('[data-price-slider]');
      if (!live) return;
      go(buildFilterUrl(base.current(), { [live.dataset.priceParam]: priceParam(live.value, live.max) }));
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
      const current = new URL(base.current());
      return go(resetUrl(r.dataset.allUrl, current.search, current.origin), { history: 'push', mode: 'full' });
    }
    const page = e.target.closest('[data-pagination] a[href]');
    if (page && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      go(new URL(page.getAttribute('href'), window.location.origin).toString(), { history: 'push', scroll: true });
    }
  });

  // Back / forward: controls must reflect the restored URL, so swap everything.
  window.addEventListener('popstate', () => {
    if (root()) go(window.location.href, { history: 'none', mode: 'full' });
  });
}

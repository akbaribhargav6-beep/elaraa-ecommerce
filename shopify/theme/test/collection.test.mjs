import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFilterUrl, carryFilters, priceParam, withSection, hasActiveFilters, swapMode, resetUrl, createUrlBase } from '../src/js/collection.mjs';

const ORIGIN = 'https://shop.test';

test('buildFilterUrl sets, replaces and deletes params and always resets the page', () => {
  const url = buildFilterUrl(`${ORIGIN}/collections/all?page=3&sort_by=manual`, {
    'filter.v.price.lte': '1500',
    sort_by: 'price-ascending',
  });
  const u = new URL(url);
  assert.equal(u.pathname, '/collections/all');
  assert.equal(u.searchParams.get('filter.v.price.lte'), '1500');
  assert.equal(u.searchParams.get('sort_by'), 'price-ascending');
  assert.equal(u.searchParams.has('page'), false);

  const cleared = new URL(buildFilterUrl(url, { 'filter.v.price.lte': undefined, sort_by: '' }));
  assert.equal(cleared.search, '');
});

test('buildFilterUrl toggles one value of a multi-value filter', () => {
  const on = buildFilterUrl(`${ORIGIN}/collections/all`, { 'filter.p.tag': { add: 'new-arrival' } });
  assert.deepEqual(new URL(on).searchParams.getAll('filter.p.tag'), ['new-arrival']);
  const both = buildFilterUrl(on, { 'filter.p.tag': { add: 'best-seller' } });
  assert.deepEqual(new URL(both).searchParams.getAll('filter.p.tag'), ['new-arrival', 'best-seller']);
  const off = buildFilterUrl(both, { 'filter.p.tag': { remove: 'new-arrival' } });
  assert.deepEqual(new URL(off).searchParams.getAll('filter.p.tag'), ['best-seller']);
  const same = buildFilterUrl(on, { 'filter.p.tag': { add: 'new-arrival' } });
  assert.deepEqual(new URL(same).searchParams.getAll('filter.p.tag'), ['new-arrival'], 'no duplicates');
});

test('carryFilters keeps filter.* and sort_by when switching collection, drops page and unrelated params', () => {
  const url = carryFilters('/collections/earrings', '?filter.v.price.lte=1200&filter.p.tag=new-arrival&sort_by=created-descending&page=4&utm_source=x', ORIGIN);
  const u = new URL(url);
  assert.equal(u.pathname, '/collections/earrings');
  assert.equal(u.searchParams.get('filter.v.price.lte'), '1200');
  assert.equal(u.searchParams.get('filter.p.tag'), 'new-arrival');
  assert.equal(u.searchParams.get('sort_by'), 'created-descending');
  assert.equal(u.searchParams.has('page'), false);
  assert.equal(u.searchParams.has('utm_source'), false);
});

test('priceParam omits the filter at (or above) the ceiling', () => {
  assert.equal(priceParam(1200, 1700), '1200');
  assert.equal(priceParam(1700, 1700), undefined);
  assert.equal(priceParam(9999, 1700), undefined);
  assert.equal(priceParam('1300', 1700), '1300');
});

test('swapMode keeps the controls mounted for same-collection updates', () => {
  // Replacing the whole section would detach the slider under the finger and
  // drop keyboard focus, so only a collection change swaps everything.
  assert.equal(swapMode(`${ORIGIN}/collections/all?filter.v.price.lte=900`, '/collections/all'), 'partial');
  assert.equal(swapMode(`${ORIGIN}/collections/all?page=2`, '/collections/all'), 'partial');
  assert.equal(swapMode(`${ORIGIN}/collections/earrings`, '/collections/all'), 'full');
  assert.equal(swapMode(`${ORIGIN}/collections/all/`, '/collections/all'), 'partial', 'trailing slash is the same collection');
});

test('resetUrl returns to all products and keeps only the sort (like resetFilters in ShopFilters.tsx)', () => {
  const u = new URL(resetUrl('/collections/all', '?filter.p.tag=new-arrival&filter.v.price.lte=900&sort_by=price-ascending&page=3', ORIGIN));
  assert.equal(u.pathname, '/collections/all');
  assert.equal(u.searchParams.get('sort_by'), 'price-ascending');
  assert.equal([...u.searchParams.keys()].length, 1);
  assert.equal(new URL(resetUrl('/collections/all', '', ORIGIN)).search, '');
});

test('createUrlBase builds later changes on the pending request, not the stale address bar', () => {
  // Tick New Arrivals, then Best Sellers before the first response returns:
  // the second URL must still contain the first tag.
  const base = createUrlBase(() => `${ORIGIN}/collections/all`);
  assert.equal(base.current(), `${ORIGIN}/collections/all`);
  const first = buildFilterUrl(base.current(), { 'filter.p.tag': { add: 'new-arrival' } });
  const idA = base.begin(first);
  const second = buildFilterUrl(base.current(), { 'filter.p.tag': { add: 'best-seller' } });
  assert.deepEqual(new URL(second).searchParams.getAll('filter.p.tag'), ['new-arrival', 'best-seller']);
  const idB = base.begin(second);
  assert.equal(base.isLatest(idA), false);
  assert.equal(base.isLatest(idB), true);
  base.settle(idA);
  assert.equal(base.current(), second, 'a stale request settling must not clear the pending URL');
  base.settle(idB);
  assert.equal(base.current(), `${ORIGIN}/collections/all`, 'falls back to the address bar once the latest settles');
});

test('withSection adds section_id without disturbing other params', () => {
  const u = new URL(withSection(`${ORIGIN}/collections/all?sort_by=manual`, 'template--1__main'));
  assert.equal(u.searchParams.get('section_id'), 'template--1__main');
  assert.equal(u.searchParams.get('sort_by'), 'manual');
});

test('hasActiveFilters is true off the all-products collection or with any filter.* param', () => {
  assert.equal(hasActiveFilters('/collections/all', ''), false);
  assert.equal(hasActiveFilters('/collections/all', '?sort_by=price-ascending'), false, 'sorting alone is not a filter');
  assert.equal(hasActiveFilters('/collections/all', '?filter.v.price.lte=900'), true);
  assert.equal(hasActiveFilters('/collections/earrings', ''), true);
  assert.equal(hasActiveFilters('/collections/all', '?page=2'), false);
});

test('main-collection keeps the controls outside the swapped node and gives them focus keys', async () => {
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'sections', 'main-collection.liquid');
  // Drop Liquid comments so prose mentioning the attributes is not matched.
  const src = (await readFile(file, 'utf8')).replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');
  const items = src.indexOf('<div data-collection-items');
  assert.ok(items > 0, 'has a [data-collection-items] swap target');
  assert.ok(src.indexOf('data-collection-sort') < items, 'the sort select sits before (outside) the swapped node');
  assert.ok(src.indexOf('data-price-slider') < items, 'the price slider sits outside the swapped node');
  for (const key of ['data-focus-key="sort"', 'data-focus-key="price"', 'data-focus-key="category:', 'data-focus-key="tag:']) {
    assert.ok(src.includes(key), `missing ${key}`);
  }
  assert.match(src, /<option value=""[^>]*>Sort: Featured<\/option>/, 'Featured clears sort_by instead of forcing manual');
  assert.match(src, /data-curated-tag=/, 'curated collections expose their tag so category switches keep it');
});

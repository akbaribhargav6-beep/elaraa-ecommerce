import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFilterUrl, carryFilters, priceParam, sliderBounds, withSection, hasActiveFilters } from '../src/js/collection.mjs';

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

test('sliderBounds rounds the collection max up to a step and keeps min below max', () => {
  assert.deepEqual(sliderBounds(162900, 400, 100), { min: 400, max: 1700 });
  assert.deepEqual(sliderBounds(170000, 400, 100), { min: 400, max: 1700 });
  assert.deepEqual(sliderBounds(30000, 400, 100), { min: 200, max: 300 }, 'floor is pulled down when it would meet the max');
  assert.deepEqual(sliderBounds(0, 400, 100), { min: 0, max: 100 });
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

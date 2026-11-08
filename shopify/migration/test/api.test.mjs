import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllProducts, fetchCategories } from '../src/api.mjs';

function fakeFetchFor(pages) {
  return async (url) => {
    const u = new URL(url);
    const body = pages[u.pathname + u.search];
    if (!body) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => body };
  };
}

test('fetchAllProducts follows totalPages and unwraps {success,data}', async () => {
  const pages = {
    '/api/products?limit=48&page=1': { success: true, data: { items: [{ slug: 'a' }], page: 1, totalPages: 2 } },
    '/api/products?limit=48&page=2': { success: true, data: { items: [{ slug: 'b' }], page: 2, totalPages: 2 } },
  };
  const items = await fetchAllProducts('https://x.test', fakeFetchFor(pages));
  assert.deepEqual(items.map((p) => p.slug), ['a', 'b']);
});

test('fetchAllProducts throws on a non-OK response', async () => {
  await assert.rejects(fetchAllProducts('https://x.test', fakeFetchFor({})), /404/);
});

test('fetchCategories unwraps data.categories', async () => {
  const pages = {
    '/api/categories': { success: true, data: { categories: [{ slug: 'earrings', productCount: 25 }] } },
  };
  const cats = await fetchCategories('https://x.test', fakeFetchFor(pages));
  assert.deepEqual(cats, [{ slug: 'earrings', productCount: 25 }]);
});

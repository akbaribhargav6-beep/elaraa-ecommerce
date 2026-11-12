import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingProgress, addItem, changeLine, getCart, CartError, createCartStore } from '../src/js/cart.mjs';

const ROUTES = { cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', cartUpdate: '/cart/update' };

function fakeFetch(handlers) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url, init });
    const h = handlers[url];
    if (!h) return { ok: false, status: 404, json: async () => ({ description: 'not found' }) };
    const res = typeof h === 'function' ? h(init) : h;
    return { ok: res.status < 400, status: res.status, json: async () => res.body };
  };
  fn.calls = calls;
  return fn;
}

test('shippingProgress clamps to 0–100 and never goes negative', () => {
  assert.deepEqual(shippingProgress(0, 2000), { percent: 0, remainingCents: 200000 });
  assert.deepEqual(shippingProgress(150000, 2000), { percent: 75, remainingCents: 50000 });
  assert.deepEqual(shippingProgress(999900, 2000), { percent: 100, remainingCents: 0 });
  assert.deepEqual(shippingProgress(200000, 2000), { percent: 100, remainingCents: 0 });
});

test('shippingProgress with no threshold reports complete', () => {
  assert.deepEqual(shippingProgress(500, 0), { percent: 100, remainingCents: 0 });
});

test('addItem posts JSON to cart/add.js then returns the refreshed cart', async () => {
  const cart = { item_count: 1, total_price: 245000, items: [] };
  const f = fakeFetch({
    '/cart/add.js': { status: 200, body: { id: 1 } },
    '/cart.js': { status: 200, body: cart },
  });
  const result = await addItem(42, 2, { fetchImpl: f, routes: ROUTES });
  assert.deepEqual(result, cart);
  assert.equal(f.calls[0].url, '/cart/add.js');
  assert.equal(f.calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(f.calls[0].init.body), { items: [{ id: 42, quantity: 2 }] });
});

test('addItem surfaces Shopify 422 description as CartError', async () => {
  const f = fakeFetch({
    '/cart/add.js': { status: 422, body: { status: 422, message: 'Cart Error', description: 'All 1 Captivate Studs are in your cart.' } },
  });
  await assert.rejects(
    addItem(1, 1, { fetchImpl: f, routes: ROUTES }),
    (e) => e instanceof CartError && e.name === 'CartError' && /Captivate/.test(e.description) && e.status === 422
  );
});

test('changeLine posts line key + quantity to cart/change.js', async () => {
  const cart = { item_count: 0, total_price: 0, items: [] };
  const f = fakeFetch({ '/cart/change.js': { status: 200, body: cart } });
  const result = await changeLine('abc:def', 0, { fetchImpl: f, routes: ROUTES });
  assert.deepEqual(result, cart);
  assert.deepEqual(JSON.parse(f.calls[0].init.body), { id: 'abc:def', quantity: 0 });
});

test('getCart reads cart.js', async () => {
  const f = fakeFetch({ '/cart.js': { status: 200, body: { item_count: 3 } } });
  assert.deepEqual(await getCart({ fetchImpl: f, routes: ROUTES }), { item_count: 3 });
});

test('createCartStore dispatches elaraa:cart:updated after every mutation', async () => {
  const events = [];
  const target = { dispatchEvent: (e) => events.push(e), addEventListener() {} };
  const cart = { item_count: 1, total_price: 100 };
  const f = fakeFetch({
    '/cart/add.js': { status: 200, body: {} },
    '/cart.js': { status: 200, body: cart },
    '/cart/change.js': { status: 200, body: { ...cart, item_count: 0 } },
  });
  const store = createCartStore({ fetchImpl: f, routes: ROUTES, target, EventCtor: FakeEvent });
  await store.add(1, 1);
  await store.change('k', 0);
  const updated = events.filter((e) => e.type === 'elaraa:cart:updated');
  assert.equal(updated.length, 2);
  assert.equal(updated[0].detail.item_count, 1);
  assert.equal(updated[1].detail.item_count, 0);
  assert.equal(store.current().item_count, 0);
  // Adding opens the drawer (the storefront opens it after every add);
  // changing a line does not.
  const opens = events.filter((e) => e.type === 'elaraa:cart:open');
  assert.equal(opens.length, 1);
  assert.equal(events.indexOf(opens[0]), 1, 'open fires right after the add update');
});

class FakeEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
}

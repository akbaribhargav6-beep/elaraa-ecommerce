import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redirectRows, REDIRECT_HEADERS } from '../src/redirects.mjs';
import { giftPackagingRows } from '../src/transform.mjs';
import { CSV_HEADERS } from '../src/transform.mjs';

test('redirectRows covers products and static pages', () => {
  const rows = redirectRows([{ slug: 'captivate' }, { slug: 'delicate' }]);
  assert.deepEqual(rows[0], { 'Redirect from': '/product/captivate', 'Redirect to': '/products/captivate' });
  assert.deepEqual(rows[1], { 'Redirect from': '/product/delicate', 'Redirect to': '/products/delicate' });
  const from = rows.map((r) => r['Redirect from']);
  for (const p of ['/shop', '/about', '/contact', '/policy', '/login', '/register', '/forgot-password', '/account/orders', '/account/addresses', '/account/wishlist']) {
    assert.ok(from.includes(p), `missing redirect for ${p}`);
  }
  const to = Object.fromEntries(rows.map((r) => [r['Redirect from'], r['Redirect to']]));
  assert.equal(to['/shop'], '/collections/all');
  assert.equal(to['/about'], '/pages/about');
  assert.equal(to['/contact'], '/pages/contact');
  assert.equal(to['/policy'], '/pages/policy');
  assert.equal(to['/login'], '/account/login');
  assert.equal(to['/register'], '/account/register');
  assert.equal(to['/forgot-password'], '/account/login');
  assert.equal(to['/account/orders'], '/account');
  assert.equal(to['/account/addresses'], '/account/addresses');
  assert.equal(to['/account/wishlist'], '/pages/wishlist');
  assert.equal(new Set(from).size, from.length, 'no duplicate sources');
  assert.deepEqual(REDIRECT_HEADERS, ['Redirect from', 'Redirect to']);
});

test('giftPackagingRows is a single hidden ₹99 product row', () => {
  const rows = giftPackagingRows();
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.deepEqual(Object.keys(r), CSV_HEADERS);
  assert.equal(r.Handle, 'gift-packaging');
  assert.equal(r.Title, 'Gift Packaging');
  assert.equal(r.Tags, 'hidden');
  assert.equal(r['Variant Price'], '99');
  assert.equal(r['Variant Compare At Price'], '');
  assert.equal(r['Option1 Name'], 'Title');
  assert.equal(r['Option1 Value'], 'Default Title');
  assert.equal(r['Variant Inventory Policy'], 'continue', 'gift add-on must never go out of stock');
  assert.equal(r['Variant Requires Shipping'], 'TRUE');
  assert.equal(r['Image Src'], '');
  assert.equal(r.Status, 'active');
  assert.equal(r.Published, 'TRUE');
});

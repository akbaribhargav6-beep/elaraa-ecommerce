import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleIndex } from '../src/js/accordions.mjs';
import { recommendationsUrl } from '../src/js/related.mjs';
import { notifyBody } from '../src/js/notify.mjs';

test('toggleIndex opens a closed item and closes the open one (single-open accordion)', () => {
  assert.equal(toggleIndex(0, 0), null, 'clicking the open item closes it');
  assert.equal(toggleIndex(0, 2), 2);
  assert.equal(toggleIndex(null, 3), 3);
});

test('recommendationsUrl targets the section-rendered recommendations endpoint', () => {
  const url = recommendationsUrl('/recommendations/products', { sectionId: 'template--1__related', productId: 99, limit: 6 });
  const u = new URL(url, 'https://x.test');
  assert.equal(u.pathname, '/recommendations/products');
  assert.equal(u.searchParams.get('section_id'), 'template--1__related');
  assert.equal(u.searchParams.get('product_id'), '99');
  assert.equal(u.searchParams.get('limit'), '6');
  assert.equal(u.searchParams.get('intent'), 'related');
});

test('recommendationsUrl respects a locale-prefixed route', () => {
  const u = new URL(recommendationsUrl('/en/recommendations/products', { sectionId: 's', productId: 1, limit: 4 }), 'https://x.test');
  assert.equal(u.pathname, '/en/recommendations/products');
  assert.equal(u.searchParams.get('limit'), '4');
});

test('notifyBody names the product and the chosen variant', () => {
  assert.equal(
    notifyBody('Diamond X Pattern', '17'),
    'Please notify me when "Diamond X Pattern" (17) is back in stock.'
  );
  assert.equal(notifyBody('Captivate Studs', 'Default Title'), 'Please notify me when "Captivate Studs" is back in stock.');
  assert.equal(notifyBody('Captivate Studs', undefined), 'Please notify me when "Captivate Studs" is back in stock.');
});

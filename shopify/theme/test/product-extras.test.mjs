import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { toggleIndex, panelMaxHeight } from '../src/js/accordions.mjs';
import { recommendationsUrl, urlFromDataset } from '../src/js/related.mjs';
import { notifyBody, pickFocusTarget, stripPostedParam } from '../src/js/notify.mjs';

const theme = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const stripComments = (s) => s.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');

test('panelMaxHeight opens to the content height, never a fixed cap', () => {
  // A fixed 500px cap cut long product descriptions off with no way to reach the rest.
  assert.equal(panelMaxHeight(true, 930), '930px');
  assert.equal(panelMaxHeight(true, 120), '120px');
  assert.equal(panelMaxHeight(false, 930), '0px');
});

test('the related-products root is observable (never display:none) and uses recommendations.performed?', async () => {
  const src = stripComments(await readFile(path.join(theme, 'sections', 'related-products.liquid'), 'utf8'));
  const rootTag = src.match(/<[a-z]+[^>]*\bdata-related\b[^>]*>/s);
  assert.ok(rootTag, 'has a [data-related] root');
  // An IntersectionObserver never reports a display:none target as intersecting.
  assert.doesNotMatch(rootTag[0], /class="[^"]*\bhidden\b/, 'the observed root must not be hidden');
  assert.match(src, /recommendations\.performed\?/, 'documented spelling of the boolean');
});

test('urlFromDataset builds the recommendations request from the root data attributes', () => {
  const url = urlFromDataset({ base: '/recommendations/products', sectionId: 'template--1__related', productId: '99', limit: '6' });
  const u = new URL(url, 'https://x.test');
  assert.equal(u.pathname, '/recommendations/products');
  assert.equal(u.searchParams.get('section_id'), 'template--1__related');
  assert.equal(u.searchParams.get('product_id'), '99');
  assert.equal(u.searchParams.get('limit'), '6');
  assert.equal(urlFromDataset({ base: '/recommendations/products' }), null, 'missing ids → no request');
});

test('pickFocusTarget prefers the phone field over the close button', () => {
  const tel = { name: 'tel' };
  const close = { name: 'close' };
  const modal = (has) => ({ querySelector: (sel) => (sel.includes('tel') ? (has.tel ? tel : null) : sel.includes('notify-close') ? close : null) });
  assert.equal(pickFocusTarget(modal({ tel: true })), tel, 'the close button precedes the input in the DOM; it must not win');
  assert.equal(pickFocusTarget(modal({ tel: false })), close, 'confirmation state has no input → close button');
});

test('stripPostedParam removes Shopify’s contact_posted flag but keeps everything else', () => {
  assert.equal(stripPostedParam('https://x.test/products/ring?contact_posted=true&variant=42#NotifyForm'), 'https://x.test/products/ring?variant=42');
  assert.equal(stripPostedParam('https://x.test/products/ring?variant=42'), 'https://x.test/products/ring?variant=42');
});

test('the Judge.me badge link is only rendered when there is a badge', async () => {
  const src = stripComments(await readFile(path.join(theme, 'snippets', 'purchase-panel.liquid'), 'utf8'));
  assert.match(src, /if\s+judgeme_badge\s*!=\s*blank/, 'an empty anchor is an invisible, unnamed tab stop');
});

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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscountUrl, normalizeCode, discountOutcome, nextLineQty, cartSectionUrl, discountList, applicableCodes } from '../src/js/cart-page.mjs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const theme = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('applicableCodes lists the codes Shopify currently honours', () => {
  const cart = { discount_codes: [{ code: 'WELCOME10', applicable: true }, { code: 'OLD', applicable: false }] };
  assert.deepEqual(applicableCodes(cart), ['WELCOME10']);
  assert.deepEqual(applicableCodes({}), []);
  assert.deepEqual(applicableCodes(null), []);
});

test('discountList keeps the codes already applied when a new one is added (the Cart API replaces the whole list)', () => {
  assert.equal(discountList(['WELCOME10'], 'festive'), 'WELCOME10,FESTIVE');
  assert.equal(discountList([], 'festive'), 'FESTIVE');
  assert.equal(discountList(['WELCOME10'], 'welcome10'), 'WELCOME10', 'no duplicates');
  assert.equal(discountList(['A', 'B'], ''), 'A,B', 'empty new code just re-posts the current list');
});

test('the cart page flags an orphaned gift-packaging line and keeps the upsell add silent', async () => {
  const src = (await readFile(path.join(theme, 'sections', 'main-cart.liquid'), 'utf8')).replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');
  // A bag holding only the ₹99 add-on must not read "empty" while the badge says 1.
  assert.match(src, /data-orphan-gift="\{\{ gift_line\.key \}\}"/);
  // The React cart page added the upsell without opening the drawer over the cart.
  assert.match(src, /data-quick-add="\{\{ upsell[^"]*\}\}"[^>]*data-quick-add-silent/);
});

test('normalizeCode trims and upper-cases a typed promo code', () => {
  assert.equal(normalizeCode('  welcome10 '), 'WELCOME10');
  assert.equal(normalizeCode(''), '');
  assert.equal(normalizeCode(undefined), '');
});

test('applyDiscountUrl sends the shopper through /discount/<CODE> and back to the cart', () => {
  assert.equal(applyDiscountUrl(' welcome10 '), '/discount/WELCOME10?redirect=%2Fcart');
  assert.equal(applyDiscountUrl('SAVE 20%'), '/discount/SAVE%2020%25?redirect=%2Fcart');
  assert.equal(applyDiscountUrl('x', '/en/cart'), '/discount/X?redirect=%2Fen%2Fcart');
});

test('discountOutcome reads the Cart API verdict for the typed code', () => {
  const cart = { discount_codes: [{ code: 'WELCOME10', applicable: true }, { code: 'OLD', applicable: false }] };
  assert.equal(discountOutcome(cart, 'welcome10'), 'applied');
  assert.equal(discountOutcome(cart, 'old'), 'not-applicable');
  assert.equal(discountOutcome({ discount_codes: [] }, 'nope'), 'not-applicable', 'Shopify dropped the code');
  // Stores / API versions without discount_codes in the cart JSON: caller falls back to the redirect.
  assert.equal(discountOutcome({ item_count: 1 }, 'welcome10'), 'unknown');
  assert.equal(discountOutcome(null, 'welcome10'), 'unknown');
});

test('nextLineQty steps within 1..max', () => {
  assert.equal(nextLineQty(1, 1, 20), 2);
  assert.equal(nextLineQty(20, 1, 20), 20);
  assert.equal(nextLineQty(1, -1, 20), 1, 'the stepper never removes a line; Remove does');
  assert.equal(nextLineQty(3, -1, 20), 2);
  assert.equal(nextLineQty(5, 1, undefined), 6);
  assert.equal(nextLineQty(99, 1, undefined), 99);
});

test('cartSectionUrl asks the cart route for one section', () => {
  assert.equal(cartSectionUrl('/cart', 'template--1__main'), '/cart?section_id=template--1__main');
  assert.equal(cartSectionUrl('/en/cart', 'a b'), '/en/cart?section_id=a%20b');
});

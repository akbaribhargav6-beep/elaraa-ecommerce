import { test } from 'node:test';
import assert from 'node:assert/strict';
import { savingsPercent, bulkInquiryUrl, isValidPincode, pincodeMessage, clampQty, variantUrl } from '../src/js/purchase.mjs';

test('savingsPercent rounds like ProductPurchasePanel.tsx and is null without a compare-at price', () => {
  assert.equal(savingsPercent(93900, 113900), 18);
  assert.equal(savingsPercent(320000, 420000), 24);
  assert.equal(savingsPercent(93900, null), null);
  assert.equal(savingsPercent(93900, 0), null);
  assert.equal(savingsPercent(93900, 93900), null, 'no saving → no badge');
  assert.equal(savingsPercent(100000, 90000), null, 'compare-at below price → no badge');
});

test('bulkInquiryUrl builds the WhatsApp deep link with the exact message', () => {
  const url = bulkInquiryUrl('919213473062', 'Captivate Studs', 'https://elaraaluxes.com/products/captivate');
  const u = new URL(url);
  assert.equal(u.origin + u.pathname, 'https://wa.me/919213473062');
  assert.equal(
    u.searchParams.get('text'),
    "Hello, I'm interested in bulk purchasing this product.\n\nProduct: Captivate Studs\nLink: https://elaraaluxes.com/products/captivate"
  );
});

test('bulkInquiryUrl strips non-digits from the number', () => {
  assert.ok(bulkInquiryUrl('+91 92134 73062', 'x', 'y').startsWith('https://wa.me/919213473062?'));
});

test('isValidPincode accepts exactly six digits', () => {
  assert.equal(isValidPincode('361001'), true);
  assert.equal(isValidPincode(' 361001 '), true);
  assert.equal(isValidPincode('36100'), false);
  assert.equal(isValidPincode('3610012'), false);
  assert.equal(isValidPincode('36100a'), false);
  assert.equal(isValidPincode(''), false);
});

test('pincodeMessage substitutes {pincode} and has a sensible default', () => {
  assert.equal(pincodeMessage('We deliver to {pincode}. Fast.', '361001'), 'We deliver to 361001. Fast.');
  assert.match(pincodeMessage('', '361001'), /361001/);
  assert.match(pincodeMessage(undefined, '361001'), /361001/);
});

test('clampQty keeps the quantity between 1 and 99', () => {
  assert.equal(clampQty(0), 1);
  assert.equal(clampQty(5), 5);
  assert.equal(clampQty(150), 99);
  assert.equal(clampQty('7'), 7);
  assert.equal(clampQty('abc'), 1);
});

test('variantUrl sets ?variant= and preserves other params and the hash', () => {
  assert.equal(variantUrl('https://x.test/products/ring?utm=a#reviews', 42), 'https://x.test/products/ring?utm=a&variant=42#reviews');
  assert.equal(variantUrl('https://x.test/products/ring?variant=1', 42), 'https://x.test/products/ring?variant=42');
});

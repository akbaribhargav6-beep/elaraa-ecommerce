import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice } from '../src/js/money.mjs';

// Shopify's Ajax API returns amounts in the smallest currency unit (paise).
// The storefront shows whole rupees with Indian digit grouping and no paise,
// matching frontend/src/lib/format.ts (`₹${Math.round(amount).toLocaleString('en-IN')}`).
test('formatPrice renders Indian grouping without paise', () => {
  assert.equal(formatPrice(123400), '₹1,234');
  assert.equal(formatPrice(10000000), '₹1,00,000');
  assert.equal(formatPrice(0), '₹0');
});

test('formatPrice rounds half-rupee amounts like the storefront', () => {
  assert.equal(formatPrice(93950), '₹940');
  assert.equal(formatPrice(93949), '₹939');
});

test('formatPrice tolerates string and nullish input from data attributes', () => {
  assert.equal(formatPrice('123400'), '₹1,234');
  assert.equal(formatPrice(undefined), '₹0');
  assert.equal(formatPrice(null), '₹0');
});

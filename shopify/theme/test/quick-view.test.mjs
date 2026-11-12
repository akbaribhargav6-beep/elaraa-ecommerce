import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectVariant, productJsonUrl, sizeOptionIndex } from '../src/js/quick-view.mjs';

const sized = {
  handle: 'diamond-x-pattern-16-17-18-size',
  options: ['Size'],
  variants: [
    { id: 1, option1: '16', available: false },
    { id: 2, option1: '17', available: true },
    { id: 3, option1: '18', available: true },
  ],
};

const single = {
  handle: 'captivate',
  options: ['Title'],
  variants: [{ id: 9, option1: 'Default Title', available: true }],
};

test('productJsonUrl targets the product .js endpoint', () => {
  assert.equal(productJsonUrl('captivate'), '/products/captivate.js');
  assert.equal(productJsonUrl('captivate', '/en'), '/en/products/captivate.js');
});

test('sizeOptionIndex finds the Size option or returns -1', () => {
  assert.equal(sizeOptionIndex(sized), 0);
  assert.equal(sizeOptionIndex(single), -1);
  assert.equal(sizeOptionIndex({ options: [{ name: 'Size', position: 2 }] }), 1);
});

test('selectVariant returns the requested size when it exists', () => {
  assert.equal(selectVariant(sized, { size: '17' }).id, 2);
  assert.equal(selectVariant(sized, { size: '16' }).id, 1, 'an unavailable size is still selectable to show Out of Stock');
});

test('selectVariant falls back to the first available, then the first variant', () => {
  assert.equal(selectVariant(sized, {}).id, 2);
  assert.equal(selectVariant(sized, { size: '99' }).id, 2);
  const allSoldOut = { ...sized, variants: sized.variants.map((v) => ({ ...v, available: false })) };
  assert.equal(selectVariant(allSoldOut, {}).id, 1);
  assert.equal(selectVariant(single, {}).id, 9);
  assert.equal(selectVariant({ variants: [] }, {}), null);
});

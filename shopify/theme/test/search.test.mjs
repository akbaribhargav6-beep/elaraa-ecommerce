import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSuggestUrl, priceStringToCents, parsePredictiveProducts } from '../src/js/search.mjs';

test('buildSuggestUrl targets the Predictive Search API for products only', () => {
  const url = buildSuggestUrl('gold ring');
  const u = new URL(url, 'https://x.test');
  assert.equal(u.pathname, '/search/suggest.json');
  assert.equal(u.searchParams.get('q'), 'gold ring');
  assert.equal(u.searchParams.get('resources[type]'), 'product');
  assert.equal(u.searchParams.get('resources[limit]'), '6');
  assert.equal(u.searchParams.get('resources[options][unavailable_products]'), 'last');
});

test('buildSuggestUrl honours a custom limit and base route', () => {
  const u = new URL(buildSuggestUrl('x', 3, '/en/search/suggest.json'), 'https://x.test');
  assert.equal(u.pathname, '/en/search/suggest.json');
  assert.equal(u.searchParams.get('resources[limit]'), '3');
});

test('priceStringToCents handles Shopify price strings', () => {
  assert.equal(priceStringToCents('1,234.00'), 123400);
  assert.equal(priceStringToCents('939.00'), 93900);
  assert.equal(priceStringToCents('₹1,189.50'), 118950);
  assert.equal(priceStringToCents(''), 0);
  assert.equal(priceStringToCents(undefined), 0);
});

test('parsePredictiveProducts maps the API shape to card data', () => {
  const json = {
    resources: {
      results: {
        products: [
          { title: 'Captivate Studs', url: '/products/captivate', price: '2,450.00', type: 'Earrings', available: true, featured_image: { url: 'https://cdn/x.jpg', alt: null } },
          { title: 'Sold Out Hoops', url: '/products/hoops', price: '3,450.00', type: 'Earrings', available: false, featured_image: null },
        ],
      },
    },
  };
  const items = parsePredictiveProducts(json);
  assert.deepEqual(items[0], { title: 'Captivate Studs', url: '/products/captivate', priceCents: 245000, type: 'Earrings', available: true, image: 'https://cdn/x.jpg', imageAlt: 'Captivate Studs' });
  assert.equal(items[1].image, null);
  assert.equal(items[1].available, false);
  assert.deepEqual(parsePredictiveProducts({}), []);
});

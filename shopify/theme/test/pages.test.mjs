import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { counterValueAt, counterSteps, formatCount, COUNTER_DURATION_MS, COUNTER_STEP_MS } from '../src/js/counter.mjs';
import { legacyShopTarget } from '../src/js/legacy.mjs';

test('legacyShopTarget maps the Next.js /shop query strings onto Shopify URLs', () => {
  const routes = { all: '/collections/all', collections: '/collections', search: '/search' };
  assert.equal(legacyShopTarget('', routes), '/collections/all');
  assert.equal(legacyShopTarget('?category=earrings', routes), '/collections/earrings');
  assert.equal(legacyShopTarget('?newArrival=true', routes), '/collections/new-arrivals');
  assert.equal(legacyShopTarget('?bestSeller=true', routes), '/collections/best-sellers');
  assert.equal(legacyShopTarget('?featured=true', routes), '/collections/featured');
  assert.equal(legacyShopTarget('?search=heart%20ring', routes), '/search?q=heart+ring&type=product');
  assert.equal(legacyShopTarget('?category=earrings&sort=price_asc', routes), '/collections/earrings?sort_by=price-ascending');
  assert.equal(legacyShopTarget('?sort=newest', routes), '/collections/all?sort_by=created-descending');
  assert.equal(legacyShopTarget('?category=../../evil', routes), '/collections/all', 'only plain slugs are accepted');
  assert.equal(legacyShopTarget('?page=3&maxPrice=1200', routes), '/collections/all', 'unmappable filters are dropped');
});

const theme = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('counter timing matches AnimatedCounter.tsx (1600 ms in 30 ms steps)', () => {
  assert.equal(COUNTER_DURATION_MS, 1600);
  assert.equal(COUNTER_STEP_MS, 30);
  assert.equal(counterSteps(), Math.ceil(1600 / 30));
});

test('counterValueAt climbs from 0 and lands exactly on the target', () => {
  const steps = counterSteps();
  assert.equal(counterValueAt(15000, 0, steps), 0);
  assert.ok(counterValueAt(15000, 1, steps) > 0);
  assert.ok(counterValueAt(15000, steps - 1, steps) < 15000);
  assert.equal(counterValueAt(15000, steps, steps), 15000);
  assert.equal(counterValueAt(15000, steps + 5, steps), 15000, 'never overshoots');
  assert.equal(Number.isInteger(counterValueAt(100, 7, steps)), true, 'whole numbers only');
});

test('formatCount uses Indian digit grouping and appends the suffix', () => {
  assert.equal(formatCount(15000, '+'), '15,000+');
  assert.equal(formatCount(100, '%'), '100%');
  assert.equal(formatCount(25), '25');
  assert.equal(formatCount(1500000, '+'), '15,00,000+');
});

test('the policy page exposes the five anchors the footer links to', async () => {
  const json = JSON.parse(await readFile(path.join(theme, 'templates', 'page.policy.json'), 'utf8'));
  const blocks = Object.values(json.sections.main.blocks);
  const anchors = blocks.map((b) => b.settings.anchor);
  assert.deepEqual(anchors, ['shipping', 'authenticity', 'privacy', 'terms', 'care']);
});

test('the 404 section redirects the legacy /shop URL that Shopify cannot redirect', async () => {
  const src = await readFile(path.join(theme, 'sections', 'main-404.liquid'), 'utf8');
  assert.match(src, /request\.path\s*==\s*'\/shop'/);
  assert.match(src, /http-equiv="refresh"/);
});

test('the contact form posts the fields the store owner needs', async () => {
  const src = await readFile(path.join(theme, 'sections', 'contact-form.liquid'), 'utf8');
  for (const name of ['contact[name]', 'contact[email]', 'contact[phone]', 'contact[Topic]', 'contact[body]']) {
    assert.ok(src.includes(`name="${name}"`), `missing ${name}`);
  }
  assert.match(src, /form 'contact'/);
});

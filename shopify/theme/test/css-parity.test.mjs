// Guards the hand-ported component CSS: every rule selector that the Next.js
// storefront defines in frontend/src/styles/globals.css must exist in the
// theme's assets/elaraa.css, and the design tokens must keep their values.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const themeCss = path.join(here, '..', 'assets', 'elaraa.css');
const sourceCss = path.join(here, '..', '..', '..', 'frontend', 'src', 'styles', 'globals.css');

function selectors(css) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  // Top-level and @media-nested rule selectors: text before a `{` that is not
  // itself an at-rule or a keyframe step.
  for (const m of noComments.matchAll(/([^{}]+)\{/g)) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith('@') || /^\d+%$|^(from|to)$/.test(sel)) continue;
    for (const part of sel.split(',')) out.add(part.trim().replace(/\s+/g, ' '));
  }
  return out;
}

test('every globals.css selector is present in assets/elaraa.css', async () => {
  const [src, theme] = await Promise.all([readFile(sourceCss, 'utf8'), readFile(themeCss, 'utf8')]);
  const want = selectors(src);
  const have = selectors(theme);
  const missing = [...want].filter((s) => !have.has(s));
  assert.deepEqual(missing, [], `missing selectors: ${missing.join(' | ')}`);
  assert.ok(want.size > 60, `sanity: parsed only ${want.size} source selectors`);
});

test('head-styles loads tailwind.css before elaraa.css so component rules win the cascade', async () => {
  // In globals.css the component rules follow the @tailwind directives, so at
  // equal specificity they beat preflight and utilities (e.g. placeholder
  // colour, .btn-luxury padding vs px-3). The theme must keep that order.
  const snippet = await readFile(path.join(here, '..', 'snippets', 'head-styles.liquid'), 'utf8');
  const tailwindAt = snippet.indexOf("'tailwind.css'");
  const elaraaAt = snippet.indexOf("'elaraa.css'");
  assert.ok(tailwindAt >= 0 && elaraaAt >= 0, 'both stylesheets are referenced');
  assert.ok(tailwindAt < elaraaAt, 'tailwind.css must be linked before elaraa.css');
});

test('design tokens keep their exact values', async () => {
  const theme = await readFile(themeCss, 'utf8');
  for (const [name, value] of [
    ['--ivory', '#F8F5F0'],
    ['--cream', '#EFE9DE'],
    ['--gold', '#C9A66B'],
    ['--gold-deep', '#A8823D'],
    ['--charcoal', '#2B2620'],
    ['--black', '#17140F'],
  ]) {
    assert.match(theme, new RegExp(`${name}:\\s*${value}`, 'i'), `${name} should be ${value}`);
  }
});

test('font variables point at the Google Fonts family names', async () => {
  const theme = await readFile(themeCss, 'utf8');
  assert.match(theme, /--font-cormorant:\s*'Cormorant Garamond'/);
  assert.match(theme, /--font-jost:\s*'Jost'/);
  assert.match(theme, /--font-caveat:\s*'Caveat'/);
  assert.doesNotMatch(theme, /@tailwind/, 'elaraa.css is hand-written, not a Tailwind input');
});

// Static guards for Liquid mistakes theme check does not catch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const theme = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function liquidFiles() {
  const out = [];
  for (const dir of ['layout', 'sections', 'snippets', 'templates', 'blocks']) {
    let names = [];
    try {
      names = await readdir(path.join(theme, dir));
    } catch {
      continue;
    }
    for (const n of names) if (n.endsWith('.liquid')) out.push(path.join(dir, n));
  }
  return out;
}

test('no `| default:` inside an image_tag argument list (Liquid parses it as a new filter and drops the rest)', async () => {
  const offenders = [];
  for (const rel of await liquidFiles()) {
    const src = await readFile(path.join(theme, rel), 'utf8');
    for (const m of src.matchAll(/image_tag:([^%}]*)/g)) {
      if (/\|\s*default:/.test(m[1])) offenders.push(`${rel}: image_tag:${m[1].trim().slice(0, 60)}…`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('every section type referenced by a JSON template or section group exists', async () => {
  const missing = [];
  for (const dir of ['templates', 'templates/customers', 'sections']) {
    let names = [];
    try {
      names = await readdir(path.join(theme, dir));
    } catch {
      continue;
    }
    for (const n of names) {
      if (!n.endsWith('.json')) continue;
      const json = JSON.parse(await readFile(path.join(theme, dir, n), 'utf8'));
      for (const [key, section] of Object.entries(json.sections ?? {})) {
        try {
          await readFile(path.join(theme, 'sections', `${section.type}.liquid`), 'utf8');
        } catch {
          missing.push(`${dir}/${n} → ${key}: sections/${section.type}.liquid`);
        }
      }
      for (const key of json.order ?? []) {
        if (!(key in (json.sections ?? {}))) missing.push(`${dir}/${n} → order lists unknown section "${key}"`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('no JSON template coexists with a Liquid template of the same name', async () => {
  const names = await readdir(path.join(theme, 'templates'));
  const json = new Set(names.filter((n) => n.endsWith('.json')).map((n) => n.replace(/\.json$/, '')));
  const clash = names.filter((n) => n.endsWith('.liquid') && json.has(n.replace(/\.liquid$/, '')));
  assert.deepEqual(clash, []);
});

test('sections never use the .reveal / .fade-in classes (they hide content; use data-reveal)', async () => {
  const offenders = [];
  for (const rel of await liquidFiles()) {
    const src = await readFile(path.join(theme, rel), 'utf8');
    if (/class="[^"]*\b(reveal|fade-in)\b[^"]*"/.test(src)) offenders.push(rel);
  }
  assert.deepEqual(offenders, []);
});

// GSAP leaves an inline transform on every revealed element, and a transformed
// ancestor becomes the containing block for position:fixed descendants — a
// lightbox nested in [data-reveal] would be sized to that wrapper, not the
// viewport.
function fixedInsideReveal(src) {
  const html = src
    .replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/g, '')
    .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '')
    .replace(/\{%[\s\S]*?%\}/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ');
  const VOID = new Set(['img', 'input', 'br', 'hr', 'source', 'meta', 'link', 'circle', 'path', 'text']);
  const stack = [];
  const offenders = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g)) {
    const [, closing, tag, attrs] = m;
    const name = tag.toLowerCase();
    if (closing) {
      const at = stack.map((s) => s.name).lastIndexOf(name);
      if (at >= 0) stack.length = at;
      continue;
    }
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
    if (/(^|\s)fixed(\s|$)/.test(cls) && stack.some((s) => s.reveal)) offenders.push(`<${name} class="${cls.slice(0, 50)}…">`);
    if (VOID.has(name) || /\/\s*$/.test(attrs)) continue;
    stack.push({ name, reveal: /\bdata-reveal\b/.test(attrs) });
  }
  return offenders;
}

test('fixedInsideReveal detects a fixed element under a data-reveal ancestor', () => {
  assert.equal(fixedInsideReveal('<div data-reveal><div class="fixed inset-0"></div></div>').length, 1);
  assert.equal(fixedInsideReveal('<div data-reveal><p>x</p></div><div class="fixed inset-0"></div>').length, 0);
  assert.equal(fixedInsideReveal('<div data-reveal><img class="a"><div><span class="hidden fixed"></span></div></div>').length, 1);
});

test('no position:fixed element is nested inside a [data-reveal] wrapper', async () => {
  const offenders = [];
  for (const rel of await liquidFiles()) {
    const src = await readFile(path.join(theme, rel), 'utf8');
    for (const o of fixedInsideReveal(src)) offenders.push(`${rel}: ${o}`);
  }
  assert.deepEqual(offenders, []);
});

test('newsletter form leaves room for the fixed header when Shopify scrolls back to it', async () => {
  const src = await readFile(path.join(theme, 'sections', 'newsletter.liquid'), 'utf8');
  assert.match(src, /form 'customer'[^%]*class: '[^']*scroll-mt-\d+/);
});

test('fallback product strips skip the hidden gift-packaging add-on', async () => {
  for (const name of ['testimonials.liquid', 'elaraa-edit.liquid']) {
    const src = await readFile(path.join(theme, 'sections', name), 'utf8');
    assert.match(src, /tags contains 'hidden'/, `${name} must skip products tagged hidden`);
  }
});

test('global overlays are rendered from the layout, not from a re-renderable section', async () => {
  const layout = await readFile(path.join(theme, 'layout', 'theme.liquid'), 'utf8');
  const header = await readFile(path.join(theme, 'sections', 'header.liquid'), 'utf8');
  for (const snippet of ['cart-drawer', 'quick-view']) {
    assert.match(layout, new RegExp(`render '${snippet}'`), `layout renders ${snippet}`);
    assert.doesNotMatch(header, new RegExp(`render '${snippet}'`), `header must not render ${snippet}`);
  }
});

test('cart drawer checkout CTA uses the documented /checkout route', async () => {
  const drawer = await readFile(path.join(theme, 'snippets', 'cart-drawer.liquid'), 'utf8');
  assert.match(drawer, /href="\/checkout"/);
  assert.doesNotMatch(drawer, /cart_url \}\}\/checkout/);
});

test('mobile drawer does not repeat Home when the menu already has it', async () => {
  const header = await readFile(path.join(theme, 'sections', 'header.liquid'), 'utf8');
  assert.match(header, /unless link\.url == routes\.root_url/, 'menu loop skips the root link');
});

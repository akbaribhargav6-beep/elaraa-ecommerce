// Usage: node src/build-products-csv.mjs
// Reads out/products.json + out/categories.json (from fetch-live.mjs) and
// writes out/products.csv for Shopify admin → Products → Import.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CSV_HEADERS, productToRows, giftPackagingRows } from './transform.mjs';
import { toCsv } from './csv.mjs';

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');

const products = JSON.parse(await readFile(path.join(outDir, 'products.json'), 'utf8'));
const categories = JSON.parse(await readFile(path.join(outDir, 'categories.json'), 'utf8'));
const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

const rows = [...products.flatMap((p) => productToRows(p, categoryNames)), ...giftPackagingRows()];
const imageCount = rows.filter((r) => r['Image Src'] !== '').length;
const productCount = new Set(rows.map((r) => r.Handle)).size;

// Shopify's importer reads the file as UTF-8; a BOM keeps the ₹-free but
// accented names (e.g. "Édition Lumière") intact if someone previews it.
await writeFile(path.join(outDir, 'products.csv'), '﻿' + toCsv(rows, CSV_HEADERS) + '\n');

console.log(`rows: ${rows.length}, products: ${productCount}, images: ${imageCount}`);

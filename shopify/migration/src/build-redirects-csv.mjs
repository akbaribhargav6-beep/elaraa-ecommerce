// Usage: node src/build-redirects-csv.mjs
// Reads out/products.json and writes out/redirects.csv.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { redirectRows, REDIRECT_HEADERS } from './redirects.mjs';
import { toCsv } from './csv.mjs';

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const products = JSON.parse(await readFile(path.join(outDir, 'products.json'), 'utf8'));

const rows = redirectRows(products);
await writeFile(path.join(outDir, 'redirects.csv'), toCsv(rows, REDIRECT_HEADERS) + '\n');

console.log(`redirects: ${rows.length}`);

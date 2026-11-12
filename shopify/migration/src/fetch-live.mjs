// Usage: node src/fetch-live.mjs
// Pulls the complete live catalog and writes out/products.json + out/categories.json.
// Override the API origin with ELARAA_API_URL (defaults to production).

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fetchAllProducts, fetchCategories } from './api.mjs';

const baseUrl = process.env.ELARAA_API_URL ?? 'https://api.elaraaluxes.com';
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');

const [products, categories] = await Promise.all([fetchAllProducts(baseUrl), fetchCategories(baseUrl)]);

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'products.json'), JSON.stringify(products, null, 1));
await writeFile(path.join(outDir, 'categories.json'), JSON.stringify(categories, null, 1));

console.log(`products: ${products.length}, categories: ${categories.length}`);

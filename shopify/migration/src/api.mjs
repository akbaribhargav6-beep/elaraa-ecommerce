// Thin client for the live ELARAA API (Express backend). Every response is
// shaped `{ success, data }`; the product list is paginated and rejects
// `limit` above 48 with HTTP 400, so we page at 48.

const PAGE_SIZE = 48;

async function getJson(url, fetchImpl) {
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`GET ${url} failed with HTTP ${res.status}`);
  const body = await res.json();
  return body && body.data !== undefined ? body.data : body;
}

/** @returns {Promise<object[]>} every ProductDTO across all pages */
export async function fetchAllProducts(baseUrl, fetchImpl = globalThis.fetch) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  do {
    const data = await getJson(`${baseUrl}/api/products?limit=${PAGE_SIZE}&page=${page}`, fetchImpl);
    items.push(...(data.items ?? []));
    totalPages = data.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return items;
}

/** @returns {Promise<object[]>} CategoryDTO[] */
export async function fetchCategories(baseUrl, fetchImpl = globalThis.fetch) {
  const data = await getJson(`${baseUrl}/api/categories`, fetchImpl);
  return data.categories ?? [];
}

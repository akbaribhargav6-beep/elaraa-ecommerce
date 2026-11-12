// "You May Also Like" — loads Shopify product recommendations through the
// Section Rendering API so the cards are the same server-rendered
// product-card snippet used everywhere else (replaces /api/products/:slug/related).

export function recommendationsUrl(base, { sectionId, productId, limit = 6, intent = 'related' }) {
  const params = new URLSearchParams();
  params.set('section_id', sectionId);
  params.set('product_id', String(productId));
  params.set('limit', String(limit));
  params.set('intent', intent);
  return `${base}?${params.toString()}`;
}

/** Request URL from the [data-related] root's data attributes, or null when incomplete. */
export function urlFromDataset(dataset) {
  if (!dataset?.base || !dataset.sectionId || !dataset.productId) return null;
  return recommendationsUrl(dataset.base, {
    sectionId: dataset.sectionId,
    productId: dataset.productId,
    limit: dataset.limit || 6,
  });
}

async function load(root) {
  if (root.dataset.loaded === '1') return;
  root.dataset.loaded = '1';
  const url = urlFromDataset(root.dataset);
  if (!url) return;
  try {
    const res = await fetch(url, { headers: { Accept: 'text/html' } });
    if (!res.ok) return;
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const inner = doc.querySelector('[data-related-inner]');
    if (!inner || !inner.querySelector('[data-product-card]')) return; // nothing to recommend → stay empty
    root.replaceChildren(inner);
    root.dispatchEvent(new CustomEvent('elaraa:section:replaced', { bubbles: true }));
  } catch {
    /* recommendations are optional; leave the block empty */
  }
}

export function initRelated(scope = document) {
  scope.querySelectorAll('[data-related]').forEach((root) => {
    if (!('IntersectionObserver' in window)) return load(root);
    // The root is an empty, zero-height block (never display:none — an
    // observer does not report hidden targets), fetched shortly before it
    // scrolls into view.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          load(root);
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(root);
  });
}

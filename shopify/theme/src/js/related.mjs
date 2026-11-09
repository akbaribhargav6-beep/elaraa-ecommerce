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

async function load(section) {
  if (section.dataset.loaded === '1') return;
  section.dataset.loaded = '1';
  try {
    const res = await fetch(section.dataset.url, { headers: { Accept: 'text/html' } });
    if (!res.ok) return;
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const inner = doc.querySelector('[data-related-inner]');
    if (!inner || !inner.querySelector('[data-product-card]')) return; // nothing to recommend → stay hidden
    section.replaceChildren(inner);
    section.classList.remove('hidden');
    section.dispatchEvent(new CustomEvent('elaraa:section:replaced', { bubbles: true }));
  } catch {
    /* recommendations are optional; leave the section hidden */
  }
}

export function initRelated(scope = document) {
  scope.querySelectorAll('[data-related][data-url]').forEach((section) => {
    if (!('IntersectionObserver' in window)) return load(section);
    // Fetch shortly before the block scrolls into view.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          load(section);
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(section);
  });
}

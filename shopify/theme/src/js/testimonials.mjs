// Testimonials polaroid gallery (ports the state logic of
// TestimonialsGallery.tsx): region filter with counts and a lightbox that
// steps through the currently visible cards. Pure helpers are unit-tested.

const REGIONS = ['west', 'north', 'south', 'east'];

/** @param {string[]} regions one entry per card */
export function regionCounts(regions) {
  const counts = { all: regions.length, west: 0, north: 0, south: 0, east: 0 };
  for (const r of regions) if (REGIONS.includes(r)) counts[r] += 1;
  return counts;
}

/** Indexes of the cards shown for the active region ('all' shows every card). */
export function visibleIndexes(regions, active) {
  const out = [];
  regions.forEach((r, i) => {
    if (active === 'all' || r === active) out.push(i);
  });
  return out;
}

export function wrapIndex(index, delta, length) {
  if (length <= 0) return 0;
  return (((index + delta) % length) + length) % length;
}

function bind(root) {
  if (root.dataset.bound === '1') return;
  root.dataset.bound = '1';

  const cards = [...root.querySelectorAll('[data-testimonial]')];
  const filters = [...root.querySelectorAll('[data-region-filter]')];
  const lightbox = root.querySelector('[data-testimonial-lightbox]');
  if (cards.length === 0 || !lightbox) return;

  const regions = cards.map((c) => c.dataset.region);
  let active = 'all';
  let position = null; // index into the visible list, or null when closed

  const image = lightbox.querySelector('[data-lightbox-image]');
  const quote = lightbox.querySelector('[data-lightbox-quote]');
  const author = lightbox.querySelector('[data-lightbox-author]');
  const product = lightbox.querySelector('[data-lightbox-product]');
  const price = lightbox.querySelector('[data-lightbox-price]');
  const steppers = lightbox.querySelectorAll('[data-lightbox-step]');

  const visible = () => visibleIndexes(regions, active);

  const paintLightbox = () => {
    const list = visible();
    const open = position !== null && list.length > 0;
    lightbox.classList.toggle('hidden', !open);
    lightbox.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const d = cards[list[position]].dataset;
    if (d.image) image.src = d.image;
    image.alt = d.productTitle || '';
    quote.textContent = `“${d.quote || ''}”`;
    author.textContent = `${d.name || ''} · ${d.regionLabel || ''}`;
    product.textContent = d.productTitle || '';
    product.setAttribute('href', d.productUrl || '#');
    price.textContent = d.productPrice || '';
    steppers.forEach((b) => b.classList.toggle('hidden', list.length <= 1));
  };

  const setRegion = (region) => {
    active = region;
    position = null;
    cards.forEach((card, i) => card.classList.toggle('hidden', !(region === 'all' || regions[i] === region)));
    filters.forEach((btn) => {
      const on = btn.dataset.regionFilter === region;
      btn.classList.toggle('active', on);
      btn.classList.toggle('hover:opacity-70', !on);
      btn.setAttribute('aria-pressed', String(on));
    });
    paintLightbox();
  };

  root.addEventListener('click', (e) => {
    const filter = e.target.closest('[data-region-filter]');
    if (filter) return setRegion(filter.dataset.regionFilter);

    const card = e.target.closest('[data-testimonial]');
    if (card) {
      position = visible().indexOf(cards.indexOf(card));
      if (position < 0) position = null;
      return paintLightbox();
    }

    const step = e.target.closest('[data-lightbox-step]');
    if (step && position !== null) {
      position = wrapIndex(position, Number(step.dataset.lightboxStep), visible().length);
      return paintLightbox();
    }

    // Close on the X button or a click on the dimmed backdrop (not the panel).
    if (e.target.closest('[data-lightbox-close]') || e.target === lightbox) {
      position = null;
      paintLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (position === null || !document.body.contains(root)) return;
    if (e.key === 'Escape') position = null;
    else if (e.key === 'ArrowLeft') position = wrapIndex(position, -1, visible().length);
    else if (e.key === 'ArrowRight') position = wrapIndex(position, 1, visible().length);
    else return;
    paintLightbox();
  });
}

export function initTestimonials(scope = document) {
  scope.querySelectorAll('[data-testimonials]').forEach(bind);
}

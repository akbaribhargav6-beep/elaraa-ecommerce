// Product gallery (ports frontend/src/components/product/ProductGallery.tsx):
// autoplay with a progress bar, prev/next, thumbnails, swipe, and a fullscreen
// lightbox with keyboard control. Every image is server-rendered in
// snippets/product-gallery.liquid; this module only switches the active one.

export const AUTOPLAY_DURATION_MS = 3500;
export const TICK_MS = 50;
const SWIPE_THRESHOLD_PX = 50;
const STEP = (TICK_MS / AUTOPLAY_DURATION_MS) * 100;

export function nextIndex(index, length, direction) {
  if (length <= 0) return 0;
  return (((index + direction) % length) + length) % length;
}

/** One autoplay tick. `next` is true when the bar is full and the slide should advance. */
export function advanceProgress(progress) {
  // The epsilon absorbs float drift so a slide lasts exactly 70 ticks.
  if (progress + STEP >= 100 - 1e-9) return { progress: 0, next: true };
  return { progress: progress + STEP, next: false };
}

/** 1 = next (swiped left), -1 = previous (swiped right), 0 = not a swipe. */
export function swipeDirection(startX, endX) {
  const dx = startX - endX;
  if (dx > SWIPE_THRESHOLD_PX) return 1;
  if (dx < -SWIPE_THRESHOLD_PX) return -1;
  return 0;
}

function bind(root) {
  if (root.dataset.bound === '1') return;
  root.dataset.bound = '1';

  const slides = [...root.querySelectorAll('[data-gallery-slide]')];
  const thumbs = [...root.querySelectorAll('[data-gallery-thumb]')];
  const lightThumbs = [...root.querySelectorAll('[data-lightbox-thumb]')];
  const bar = root.querySelector('[data-gallery-progress]');
  const counter = root.querySelector('[data-gallery-counter]');
  const toggle = root.querySelector('[data-gallery-autoplay]');
  const lightbox = root.querySelector('[data-gallery-lightbox]');
  const lightImage = root.querySelector('[data-lightbox-image]');
  const frame = root.querySelector('[data-gallery-frame]');
  const count = slides.length;
  if (count === 0) return;

  let index = 0;
  let autoplay = true;
  let progress = 0;
  let lightboxOpen = false;
  let touchStartX = 0;

  const paint = () => {
    slides.forEach((el, i) => {
      el.classList.toggle('opacity-100', i === index);
      el.classList.toggle('opacity-0', i !== index);
      el.setAttribute('aria-hidden', String(i !== index));
    });
    thumbs.forEach((el, i) => {
      el.style.borderColor = i === index ? 'var(--gold-deep)' : 'transparent';
      el.setAttribute('aria-current', String(i === index));
    });
    lightThumbs.forEach((el, i) => {
      el.style.borderColor = i === index ? 'var(--gold)' : 'transparent';
      el.style.opacity = i === index ? '1' : '0.6';
    });
    if (counter) counter.textContent = `${index + 1} / ${count}`;
    if (bar) bar.style.width = `${progress}%`;
    if (lightImage && lightboxOpen) {
      const active = slides[index];
      lightImage.src = active.dataset.full || active.currentSrc || active.src;
      lightImage.alt = active.alt || '';
    }
  };

  const goTo = (next) => {
    index = nextIndex(next, count, 0);
    progress = 0;
    paint();
  };

  const setLightbox = (open) => {
    if (!lightbox) return;
    lightboxOpen = open;
    lightbox.classList.toggle('hidden', !open);
    lightbox.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    paint();
  };

  if (count > 1) {
    const timer = setInterval(() => {
      if (!document.body.contains(root)) return clearInterval(timer);
      if (!autoplay) return;
      const r = advanceProgress(progress);
      progress = r.progress;
      if (r.next) index = nextIndex(index, count, 1);
      if (r.next) paint();
      else if (bar) bar.style.width = `${progress}%`;
    }, TICK_MS);
  }

  root.addEventListener('click', (e) => {
    const step = e.target.closest('[data-gallery-step]');
    if (step) {
      e.stopPropagation();
      return goTo(index + Number(step.dataset.galleryStep));
    }
    const thumb = e.target.closest('[data-gallery-thumb], [data-lightbox-thumb]');
    if (thumb) {
      e.stopPropagation();
      return goTo(Number(thumb.dataset.galleryThumb ?? thumb.dataset.lightboxThumb));
    }
    if (e.target.closest('[data-gallery-autoplay]')) {
      autoplay = !autoplay;
      toggle.textContent = autoplay ? '⏸' : '▶';
      toggle.setAttribute('aria-label', autoplay ? 'Pause slideshow' : 'Play slideshow');
      return;
    }
    if (e.target.closest('[data-gallery-expand]')) return setLightbox(true);
    if (e.target.closest('[data-lightbox-close]')) return setLightbox(false);
    // A click on the dimmed backdrop (not the image stage or thumbnails) closes it.
    if (lightboxOpen && lightbox.contains(e.target) && !e.target.closest('[data-lightbox-stage], [data-lightbox-thumbs]')) {
      setLightbox(false);
    }
  });

  if (frame) {
    frame.addEventListener('touchstart', (e) => (touchStartX = e.changedTouches[0].screenX), { passive: true });
    frame.addEventListener(
      'touchend',
      (e) => {
        const dir = swipeDirection(touchStartX, e.changedTouches[0].screenX);
        if (dir !== 0) goTo(index + dir);
      },
      { passive: true }
    );
  }

  document.addEventListener('keydown', (e) => {
    if (!lightboxOpen || !document.body.contains(root)) return;
    if (e.key === 'Escape') setLightbox(false);
    else if (e.key === 'ArrowLeft') goTo(index - 1);
    else if (e.key === 'ArrowRight') goTo(index + 1);
  });

  paint();
}

export function initGalleries(scope = document) {
  scope.querySelectorAll('[data-gallery]').forEach(bind);
}

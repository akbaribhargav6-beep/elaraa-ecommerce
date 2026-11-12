// Ports frontend/src/lib/gsap-lenis-provider.tsx and
// components/ui/RevealOnScroll.tsx. GSAP, ScrollTrigger and Lenis are loaded
// as classic scripts (assets/vendor-*.js) before this bundle, so they are
// read from window rather than imported.

const REVEAL_SELECTOR = '[data-reveal]';
const DESKTOP_POINTER = '(min-width: 769px)';

function libs() {
  const { gsap, ScrollTrigger, Lenis } = window;
  return { gsap, ScrollTrigger, Lenis };
}

/** Lenis smooth scroll + GSAP ticker wiring (one instance per page). */
export function initSmoothScroll() {
  const { gsap, ScrollTrigger, Lenis } = libs();
  if (!gsap || !Lenis) return null;
  const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  if (ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Fade-up-on-scroll for every [data-reveal] element (optional data-reveal-delay in seconds). */
export function initReveals(root = document) {
  const { gsap, ScrollTrigger } = libs();
  const targets = root.querySelectorAll(REVEAL_SELECTOR);
  if (!gsap || !ScrollTrigger) {
    targets.forEach((el) => el.removeAttribute('data-reveal'));
    return 0;
  }
  gsap.registerPlugin(ScrollTrigger);
  targets.forEach((el) => {
    if (el.dataset.revealBound === '1') return;
    el.dataset.revealBound = '1';
    const delay = Number(el.dataset.revealDelay || 0);
    gsap.set(el, { opacity: 0, y: 32 });
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      delay,
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });
  return targets.length;
}

/** Gold cursor dot that grows over links and buttons (desktop only). */
export function initCursor() {
  const dot = document.querySelector('.cursor-dot');
  if (!dot || !window.matchMedia(DESKTOP_POINTER).matches) return;
  const move = (e) => {
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
  };
  const grow = () => {
    dot.style.width = '28px';
    dot.style.height = '28px';
    dot.style.opacity = '.5';
  };
  const shrink = () => {
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.opacity = '1';
  };
  window.addEventListener('mousemove', move);
  // Delegated so elements injected later (cart drawer, quick view) also react.
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest('a,button')) grow();
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest('a,button')) shrink();
  });
}

/** Adds .nav-scrolled to .nav-fixed once the page is scrolled past 60px. */
export function initNavScroll() {
  const nav = document.querySelector('.nav-fixed');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('nav-scrolled', window.scrollY > 60);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function initMotion(settings = {}) {
  if (settings.enableSmoothScroll !== false) initSmoothScroll();
  initReveals();
  if (settings.enableCursor !== false) initCursor();
  initNavScroll();
  // Theme editor re-renders sections in place; bind reveals on new markup.
  document.addEventListener('shopify:section:load', (e) => initReveals(e.target));
}

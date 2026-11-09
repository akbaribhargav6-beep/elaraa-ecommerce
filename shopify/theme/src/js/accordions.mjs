// "Everything You Need To Know" accordion (ports ProductAccordions.tsx):
// one item open at a time, the first open by default, max-height transition.

/** @returns {number|null} the index that should be open after clicking `clicked` */
export function toggleIndex(open, clicked) {
  return open === clicked ? null : clicked;
}

/**
 * An open panel is as tall as its content. (ProductAccordions.tsx used a fixed
 * 500px, which clips a long product description with no way to reach the rest.)
 */
export function panelMaxHeight(open, scrollHeight) {
  return open ? `${scrollHeight}px` : '0px';
}

function bind(root) {
  if (root.dataset.bound === '1') return;
  root.dataset.bound = '1';
  const items = [...root.querySelectorAll('[data-accordion-item]')];
  let open = items.findIndex((el) => el.dataset.open === 'true');
  if (open < 0) open = null;

  const paint = () => {
    items.forEach((item, i) => {
      const on = i === open;
      const button = item.querySelector('[data-accordion-button]');
      const panel = item.querySelector('[data-accordion-panel]');
      const arrow = item.querySelector('[data-accordion-arrow]');
      item.dataset.open = String(on);
      if (button) button.setAttribute('aria-expanded', String(on));
      if (panel) {
        panel.style.maxHeight = panelMaxHeight(on, panel.scrollHeight);
        panel.style.opacity = on ? '1' : '0';
        panel.toggleAttribute('inert', !on);
      }
      if (arrow) arrow.style.transform = on ? 'rotate(180deg)' : 'none';
    });
  };

  root.addEventListener('click', (e) => {
    const button = e.target.closest('[data-accordion-button]');
    if (!button) return;
    const index = items.indexOf(button.closest('[data-accordion-item]'));
    if (index < 0) return;
    open = toggleIndex(open, index);
    paint();
  });

  // Content height changes with the viewport width and when fonts/images load.
  window.addEventListener('resize', paint, { passive: true });
  window.addEventListener('load', paint, { once: true });
  paint();
}

export function initAccordions(scope = document) {
  scope.querySelectorAll('[data-accordion]').forEach(bind);
}

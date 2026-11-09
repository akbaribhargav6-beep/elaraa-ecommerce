// New Arrivals spotlight (ports the selector behaviour of
// NewArrivalsSpotlight.tsx). All stage panels are server-rendered; picking a
// card on the right shows its panel and restyles the selector list.

const ACTIVE = { background: '#fffbeb', borderColor: '#fbbf24' };
const IDLE = { background: 'white', borderColor: 'rgba(43,38,32,.1)' };

function activate(root, index) {
  root.querySelectorAll('[data-spotlight-panel]').forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.spotlightPanel !== String(index));
  });
  root.querySelectorAll('[data-spotlight-select]').forEach((btn) => {
    const on = btn.dataset.spotlightSelect === String(index);
    Object.assign(btn.style, on ? ACTIVE : IDLE);
    btn.setAttribute('aria-pressed', String(on));
    const state = btn.querySelector('[data-spotlight-state]');
    if (state) {
      state.textContent = on ? '★ Active' : 'Select →';
      state.style.color = on ? '#b45309' : '';
      state.style.opacity = on ? '' : '0.4';
    }
  });
}

export function initSpotlights() {
  if (document.body.dataset.spotlightBound === '1') return;
  document.body.dataset.spotlightBound = '1';
  // Delegated, so sections re-rendered by the theme editor keep working.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-spotlight-select]');
    if (!btn) return;
    const root = btn.closest('[data-spotlight]');
    if (root) activate(root, btn.dataset.spotlightSelect);
  });
}

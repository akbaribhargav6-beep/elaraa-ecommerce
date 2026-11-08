// Product card behaviour (ports frontend/src/components/ui/ProductCard.tsx):
// "+ Bag" quick add and the Quick View trigger. Event-delegated so cards
// injected later (search, recommendations, wishlist page) work too. The
// wishlist heart is handled by wishlist.mjs.
import { notify, MESSAGES } from './toast.mjs';
import { CartError } from './cart.mjs';

export function initProductCards(store, quickView) {
  if (document.body.dataset.cardsBound === '1') return;
  document.body.dataset.cardsBound = '1';

  document.addEventListener('click', async (e) => {
    const quickAdd = e.target.closest('[data-quick-add]');
    if (quickAdd) {
      e.preventDefault();
      if (quickAdd.disabled || quickAdd.dataset.busy === '1') return;
      const variantId = Number(quickAdd.dataset.quickAdd);
      if (!variantId) return;
      const original = quickAdd.textContent;
      quickAdd.dataset.busy = '1';
      quickAdd.textContent = 'Adding…';
      try {
        await store.add(variantId, 1);
      } catch (err) {
        notify(err instanceof CartError ? err.description : MESSAGES.addFailed);
      } finally {
        quickAdd.dataset.busy = '0';
        quickAdd.textContent = original;
      }
      return;
    }

    const trigger = e.target.closest('[data-quick-view]');
    if (trigger && quickView) {
      e.preventDefault();
      const d = trigger.dataset;
      quickView.open(d.quickView, {
        eyebrow: d.eyebrow || '',
        shortDescription: d.shortDescription || '',
        metalFinish: d.metalFinish || '',
        metalHex: d.metalHex || '',
      });
    }
  });
}

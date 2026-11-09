// "Notify Me When Available" modal (ports NotifyMeModal.tsx). The request is a
// Shopify contact-form submission (spec: no back-in-stock app), so the shop
// owner receives an email with the product, variant, phone and email.

export function notifyBody(productTitle, variantTitle) {
  const variant = variantTitle && variantTitle !== 'Default Title' ? ` (${variantTitle})` : '';
  return `Please notify me when "${productTitle}"${variant} is back in stock.`;
}

/**
 * Where focus goes when the modal opens: the phone field, else (confirmation
 * state) the close button. Two queries on purpose — a combined selector
 * returns the close button, which comes first in the DOM, and then Enter
 * would close the modal instead of submitting.
 */
export function pickFocusTarget(modal) {
  return modal.querySelector('input[type="tel"]') || modal.querySelector('[data-notify-close]');
}

/** Drops Shopify's ?contact_posted=true (and the form anchor) so reload / share use the clean URL. */
export function stripPostedParam(currentUrl) {
  const url = new URL(currentUrl);
  if (!url.searchParams.has('contact_posted')) return currentUrl;
  url.searchParams.delete('contact_posted');
  url.hash = '';
  return url.toString();
}

export function initNotify() {
  const modal = document.querySelector('[data-notify-modal]');
  if (!modal || modal.dataset.bound === '1') return;
  modal.dataset.bound = '1';

  const variantField = modal.querySelector('[data-notify-variant]');
  const bodyField = modal.querySelector('[data-notify-body]');
  const productTitle = modal.dataset.productTitle || '';

  const setOpen = (open) => {
    modal.classList.toggle('hidden', !open);
    modal.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) pickFocusTarget(modal)?.focus({ preventScroll: true });
  };

  document.addEventListener('elaraa:notify:open', (e) => {
    const variantTitle = e.detail?.variant;
    if (variantField) variantField.value = variantTitle && variantTitle !== 'Default Title' ? variantTitle : '';
    if (bodyField) bodyField.value = notifyBody(e.detail?.title || productTitle, variantTitle);
    setOpen(true);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-notify-close]')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) setOpen(false);
  });

  // After the form posts, Shopify reloads the product page; reopen the modal
  // to show the confirmation (or the error).
  if (modal.hasAttribute('data-notify-auto-open')) {
    setOpen(true);
    const clean = stripPostedParam(window.location.href);
    if (clean !== window.location.href) window.history.replaceState(window.history.state, '', clean);
  }
}

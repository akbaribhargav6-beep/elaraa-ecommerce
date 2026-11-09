// "Notify Me When Available" modal (ports NotifyMeModal.tsx). The request is a
// Shopify contact-form submission (spec: no back-in-stock app), so the shop
// owner receives an email with the product, variant, phone and email.

export function notifyBody(productTitle, variantTitle) {
  const variant = variantTitle && variantTitle !== 'Default Title' ? ` (${variantTitle})` : '';
  return `Please notify me when "${productTitle}"${variant} is back in stock.`;
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
    if (open) modal.querySelector('input[type="tel"], [data-notify-close]')?.focus({ preventScroll: true });
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
  if (modal.hasAttribute('data-notify-auto-open')) setOpen(true);
}

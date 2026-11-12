// Customer account pages (classic accounts): the Address Book's add-address
// toggle, Shopify's country → province selector, and the delete confirmation.

export function addressToggleLabel(open) {
  return open ? 'Cancel' : '+ Add Address';
}

/** Element ids for Shopify.CountryProvinceSelector, by form suffix (e.g. "New"). */
export function provinceSelectorArgs(suffix) {
  return {
    country: `AddressCountry${suffix}`,
    province: `AddressProvince${suffix}`,
    options: { hideElement: `AddressProvinceContainer${suffix}` },
  };
}

/**
 * The add-address form starts hidden. It must open when the page comes back
 * from Shopify with validation errors rendered inside it — otherwise the
 * customer sees an unchanged list and no message.
 */
export function shouldOpenAddressForm(form) {
  return form.hasAttribute('data-open') || Boolean(form.querySelector('[data-form-errors]'));
}

export function initAccount() {
  const book = document.querySelector('[data-address-book]');
  if (!book || book.dataset.bound === '1') return;
  book.dataset.bound = '1';

  const toggle = book.querySelector('[data-address-toggle]');
  const form = book.querySelector('[data-address-form]');
  if (toggle && form) {
    const paint = (open) => {
      form.classList.toggle('hidden', !open);
      toggle.textContent = addressToggleLabel(open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) form.querySelector('input:not([type="hidden"])')?.focus({ preventScroll: true });
    };
    toggle.addEventListener('click', () => paint(form.classList.contains('hidden')));
    // Shopify reloads the page with the form's errors after a failed save.
    if (shouldOpenAddressForm(form)) paint(true);
  }

  // Shopify's shared script fills the province list for the chosen country.
  book.querySelectorAll('[data-province-suffix]').forEach((el) => {
    const Selector = window.Shopify?.CountryProvinceSelector;
    if (!Selector) return;
    const args = provinceSelectorArgs(el.dataset.provinceSuffix);
    if (document.getElementById(args.country) && document.getElementById(args.province)) {
      new Selector(args.country, args.province, args.options);
    }
  });

  book.addEventListener('submit', (e) => {
    const del = e.target.closest('[data-address-delete]');
    if (del && !window.confirm(del.dataset.confirm || 'Delete this address?')) e.preventDefault();
  });
}

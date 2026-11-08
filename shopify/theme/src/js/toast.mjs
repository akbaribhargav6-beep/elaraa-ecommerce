// Ports frontend/src/lib/toast-context.tsx: a bottom-centre toast stack so a
// failed cart/wishlist action is visible instead of silently doing nothing.
const AUTO_DISMISS_MS = 4000;
let container = null;

function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none px-4 w-full max-w-md';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}

/** @param {'error'|'success'} variant */
export function notify(message, variant = 'error') {
  const el = document.createElement('div');
  el.className = 'pointer-events-auto text-xs sm:text-sm px-4 py-3 rounded-sm shadow-xl w-full text-center';
  el.style.cssText =
    variant === 'error'
      ? 'background:#2B2620;color:#F8F5F0;border:1px solid rgba(220,38,38,.5)'
      : 'background:var(--black);color:var(--ivory);border:1px solid rgba(201,166,107,.4)';
  el.textContent = message;
  ensureContainer().appendChild(el);
  setTimeout(() => el.remove(), AUTO_DISMISS_MS);
}

export const MESSAGES = {
  addFailed: "Couldn't add this to your bag — please try again.",
  updateFailed: "Couldn't update quantity — please try again.",
  removeFailed: "Couldn't remove that item — please try again.",
  wishlistFailed: 'Something went wrong updating your wishlist.',
  checkoutFailed: "Couldn't start checkout — please try again.",
};

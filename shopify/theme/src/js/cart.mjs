// Ajax Cart API client (replaces frontend/src/lib/cart-context.tsx). Pure
// request helpers take { fetchImpl, routes } so they are unit-testable; the
// store wraps them and broadcasts `elaraa:cart:updated` on document.

export class CartError extends Error {
  constructor(message, { status, description } = {}) {
    super(message);
    this.name = 'CartError';
    this.status = status;
    this.description = description || message;
  }
}

const DEFAULT_ROUTES = { cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', cartUpdate: '/cart/update' };

function js(route) {
  return route.endsWith('.js') ? route : `${route}.js`;
}

async function request(url, init, fetchImpl) {
  const res = await fetchImpl(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    throw new CartError(body?.message || `Cart request failed (${res.status})`, {
      status: res.status,
      description: body?.description || body?.message,
    });
  }
  return body;
}

export async function getCart({ fetchImpl = globalThis.fetch, routes = DEFAULT_ROUTES } = {}) {
  return request(js(routes.cart), { method: 'GET' }, fetchImpl);
}

export async function addItem(variantId, quantity = 1, { fetchImpl = globalThis.fetch, routes = DEFAULT_ROUTES } = {}) {
  await request(js(routes.cartAdd), { method: 'POST', body: JSON.stringify({ items: [{ id: variantId, quantity }] }) }, fetchImpl);
  return getCart({ fetchImpl, routes });
}

export async function changeLine(key, quantity, { fetchImpl = globalThis.fetch, routes = DEFAULT_ROUTES } = {}) {
  return request(js(routes.cartChange), { method: 'POST', body: JSON.stringify({ id: key, quantity }) }, fetchImpl);
}

/**
 * Free-shipping progress for the cart page bar.
 * @param {number} subtotalCents cart.total_price (paise)
 * @param {number} thresholdRupees theme setting, e.g. 2000
 */
export function shippingProgress(subtotalCents, thresholdRupees) {
  const thresholdCents = Math.round(Number(thresholdRupees) * 100);
  if (!(thresholdCents > 0)) return { percent: 100, remainingCents: 0 };
  const subtotal = Math.max(0, Number(subtotalCents) || 0);
  const percent = Math.min(100, Math.round((subtotal / thresholdCents) * 100));
  return { percent, remainingCents: Math.max(0, thresholdCents - subtotal) };
}

/**
 * Stateful store shared by the header badge, drawer, cards and cart page.
 * `target` and `EventCtor` are injectable for tests (default document/CustomEvent).
 */
export function createCartStore({
  fetchImpl = globalThis.fetch,
  routes = DEFAULT_ROUTES,
  target = globalThis.document,
  EventCtor = globalThis.CustomEvent,
  initial = null,
} = {}) {
  let cart = initial;
  const emit = (type, detail) => target?.dispatchEvent(new EventCtor(type, { detail }));
  const set = (next) => {
    cart = next;
    emit('elaraa:cart:updated', cart);
    return cart;
  };
  return {
    current: () => cart,
    refresh: async () => set(await getCart({ fetchImpl, routes })),
    add: async (variantId, quantity = 1, { open = true } = {}) => {
      const next = set(await addItem(variantId, quantity, { fetchImpl, routes }));
      if (open) emit('elaraa:cart:open', next);
      return next;
    },
    change: async (key, quantity) => set(await changeLine(key, quantity, { fetchImpl, routes })),
    remove: async (key) => set(await changeLine(key, 0, { fetchImpl, routes })),
    open: () => emit('elaraa:cart:open', cart),
  };
}

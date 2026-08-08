const PRIMARY_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
// api.elaraaluxes.com is a brand-new subdomain — some visitors' DNS
// resolvers (ISP/router-level, not this app's fault) haven't caught up with
// it yet and return a stale "domain doesn't exist" answer, which makes every
// request fail instantly with a network error before it ever reaches
// Railway. This is the original, long-stable Railway URL the custom domain
// was pointed at, kept as a fallback so those visitors aren't fully blocked
// while their resolver catches up.
const FALLBACK_API_URL = 'https://elaraa-backend-production.up.railway.app';

// Once a request proves the primary origin is unreachable from this client,
// remember it for the rest of the session instead of eating the DNS-failure
// latency on every single call.
let activeApiUrl = PRIMARY_API_URL;

// getUploadUrl/getCategoryImageUrl need the currently-active origin, but are
// plain functions (not hooks) — a getter keeps them in sync with fallback
// switches without needing every call site to be rewritten as stateful.
function currentApiUrl(): string {
  return activeApiUrl;
}

// Access token lives in memory only (never localStorage — XSS-safe). The
// refresh token is an httpOnly cookie the browser sends automatically.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Guest cart identity. In production the frontend (vercel.app) and backend
// (railway.app) are different domains, so the guest-cart cookie is a
// third-party cookie — Safari, Firefox (strict), and Brave block those by
// default, silently minting a brand-new empty cart on every request for
// affected visitors (add appears to work, but a later remove/update can't
// find the item because it's now looking at a different cart). A token kept
// in this origin's own localStorage and sent as a header sidesteps
// third-party-cookie blocking entirely.
const GUEST_CART_TOKEN_KEY = 'elaraa_cart_token';

function getGuestCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let token = window.localStorage.getItem(GUEST_CART_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      window.localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
    }
    return token;
  } catch {
    // localStorage unavailable (private mode / disabled storage) — fall
    // back to cookie-only identity for this request.
    return null;
  }
}

export function clearGuestCartToken() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(GUEST_CART_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export class ApiClientError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuthRetry?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = rawFetch(activeApiUrl, '/api/auth/refresh', { method: 'POST' }, undefined, undefined)
      .then(async (res) => {
        if (!res.ok) return false;
        const json = await res.json();
        setAccessToken(json.data.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function rawFetch(
  origin: string,
  path: string,
  rest: RequestInit,
  body: unknown,
  headers: HeadersInit | undefined
): Promise<Response> {
  return fetch(`${origin}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(getGuestCartToken() ? { 'X-Cart-Token': getGuestCartToken()! } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRetry, headers, ...rest } = options;

  const doFetch = async () => {
    try {
      return await rawFetch(activeApiUrl, path, rest, body, headers);
    } catch (err) {
      // A rejected fetch() here means the request never reached the server
      // at all — DNS resolution failure, connection refused, etc. — not an
      // HTTP error response (those resolve normally with res.ok === false).
      // Fall back to the known-stable Railway origin once, and keep using it
      // for the rest of the session rather than eating this failure again on
      // every subsequent call.
      if (activeApiUrl !== FALLBACK_API_URL && PRIMARY_API_URL !== FALLBACK_API_URL) {
        activeApiUrl = FALLBACK_API_URL;
        return await rawFetch(activeApiUrl, path, rest, body, headers);
      }
      throw err;
    }
  };

  let res = await doFetch();

  // Access token expired mid-session — refresh once and retry transparently.
  if (res.status === 401 && !skipAuthRetry && path !== '/api/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) res = await doFetch();
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiClientError(res.status, json?.message ?? `Request failed (${res.status})`, json?.errors);
  }

  return json?.data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};

export function getUploadUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${currentApiUrl()}${url}`;
}

// Category images can be either a backend-uploaded file (served from the API
// at /uploads/...) or one of the original static assets shipped in the
// frontend's own /public/images/categories/ folder (pre-dating the admin
// upload feature). Only the former needs the API origin prefixed — a
// frontend-relative path must be left as-is or it would incorrectly resolve
// against the backend origin instead of Next's own public folder.
export function getCategoryImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/uploads')) return getUploadUrl(url);
  return url;
}

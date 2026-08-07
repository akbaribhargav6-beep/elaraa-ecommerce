const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
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

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRetry, headers, ...rest } = options;

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
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
  return url.startsWith('http') ? url : `${API_URL}${url}`;
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

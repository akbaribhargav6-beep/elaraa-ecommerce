// Server-side fetch helper for Server Components — used only for public,
// unauthenticated reads (catalog, categories, reviews). Never share the
// browser's in-memory access token here: this module runs on the server and
// its state would leak across unrelated requests.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function apiGetServer<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as T;
  } catch {
    return null;
  }
}

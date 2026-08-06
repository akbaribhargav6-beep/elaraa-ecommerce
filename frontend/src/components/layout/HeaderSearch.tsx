'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductListResponse } from '@elaraa/shared';
import { api, getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 6;

// Site-wide instant search: lives in the header so it's available from every
// page, not just /shop. Clicking the icon toggles an inline dropdown (no
// navigation); typing debounces a call to the real product search API and
// clicking a result goes straight to that product's detail page.
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [panelTop, setPanelTop] = useState(64);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  function close() {
    setOpen(false);
    setQuery('');
    setResults(null);
  }

  useEffect(() => {
    if (!open) return;
    // Anchor the panel to the header's actual bottom edge (fixed to the
    // viewport, not the button) so it never overflows the screen edge on
    // narrow viewports and stays correct regardless of header height.
    const nav = document.querySelector('.nav-fixed');
    if (nav) setPanelTop(nav.getBoundingClientRect().bottom + 8);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.get<ProductListResponse>(
          `/api/products?search=${encodeURIComponent(q)}&limit=${RESULT_LIMIT}&sort=featured`
        );
        if (requestIdRef.current === requestId) setResults(data);
      } catch {
        if (requestIdRef.current === requestId) setResults(null);
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const trimmed = query.trim();
  const showEmpty = !loading && trimmed.length >= MIN_QUERY_LENGTH && results?.items.length === 0;
  const showHint = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close search' : 'Search'}
        aria-expanded={open}
        className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center hover:opacity-60"
      >
        {open ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="fixed left-4 right-4 sm:left-auto sm:right-6 md:right-12 sm:w-96 bg-white shadow-2xl z-50 rounded-sm overflow-hidden"
          style={{ border: '1px solid rgba(43,38,32,.12)', top: panelTop }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, SKU, category..."
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && <p className="p-4 text-xs opacity-60">Searching…</p>}
            {showEmpty && <p className="p-4 text-xs opacity-60">No products found for &ldquo;{trimmed}&rdquo;.</p>}
            {showHint && <p className="p-4 text-xs opacity-40">Keep typing…</p>}
            {!loading &&
              results?.items.map((p) => {
                const img = p.images.find((i) => i.isPrimary) ?? p.images[0];
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--cream)] transition-colors"
                  >
                    <div className="relative w-12 h-12 shrink-0 bg-[var(--cream)] overflow-hidden rounded-sm">
                      {img && <Image src={getUploadUrl(img.url)} alt={p.name} fill className="object-cover" sizes="48px" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{p.name}</p>
                      <p className="text-xs opacity-60 capitalize">{p.categorySlug}</p>
                    </div>
                    <p className="text-xs font-medium shrink-0">{formatPrice(p.basePrice)}</p>
                  </Link>
                );
              })}
          </div>

          {!loading && trimmed.length >= MIN_QUERY_LENGTH && (results?.items.length ?? 0) > 0 && (
            <Link
              href={`/shop?search=${encodeURIComponent(trimmed)}`}
              onClick={close}
              className="block text-center text-xs uppercase tracking-widest py-3 border-t hover:opacity-70"
              style={{ borderColor: 'rgba(43,38,32,.1)', color: 'var(--gold-deep)' }}
            >
              View All Results →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

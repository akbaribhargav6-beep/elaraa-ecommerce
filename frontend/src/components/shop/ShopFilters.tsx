'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CategoryDTO } from '@elaraa/shared';

const MAX_PRICE_CEILING = 9000;
const MAX_PRICE_FLOOR = 2000;

function useUpdateParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '') params.delete(key);
      else params.set(key, value);
    });
    params.delete('page'); // any filter change resets pagination
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };
}

// Search bar + mobile filter toggle + sidebar (category/price), all sharing
// state in one client component so the "Filters" button can show/hide the
// sidebar on mobile. The product grid itself stays server-rendered and is
// passed in as children, positioned alongside the sidebar.
export function ShopControls({
  categories,
  totalCount,
  children,
}: {
  categories: CategoryDTO[];
  totalCount: number;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const update = useUpdateParams();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice') ?? MAX_PRICE_CEILING));
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIsFirstRender = useRef(true);
  const priceIsFirstRender = useRef(true);

  const activeCategory = searchParams.get('category') ?? '';
  const activeNewArrival = searchParams.get('newArrival') === 'true';
  const activeBestSeller = searchParams.get('bestSeller') === 'true';

  // Debounce free-typed search and slider drags so every keystroke/tick
  // doesn't fire a fresh request, while everything still updates live with
  // no full page navigation (router.replace + scroll:false). Separate refs
  // per field — sharing one ref meant the second effect's mount-time clear
  // was cancelling the first effect's pending timeout before it could fire.
  useEffect(() => {
    if (searchIsFirstRender.current) {
      searchIsFirstRender.current = false;
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      update({ search: search || undefined });
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (priceIsFirstRender.current) {
      priceIsFirstRender.current = false;
      return;
    }
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      update({ maxPrice: maxPrice < MAX_PRICE_CEILING ? String(maxPrice) : undefined });
    }, 250);
    return () => {
      if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPrice]);

  function resetFilters() {
    setSearch('');
    setMaxPrice(MAX_PRICE_CEILING);
    update({ search: undefined, maxPrice: undefined, category: undefined, newArrival: undefined, bestSeller: undefined });
  }

  const hasActiveFilters =
    !!activeCategory || activeNewArrival || activeBestSeller || !!search || maxPrice < MAX_PRICE_CEILING;

  return (
    <>
      {/* Search bar + mobile filter toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center p-3 border" style={{ background: 'var(--cream)', borderColor: 'rgba(43,38,32,.15)' }}>
        <div className="flex-1 relative flex items-center">
          <span className="absolute left-3 text-stone-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by jewellery name, material, category..."
            className="w-full pl-9 pr-4 py-2 bg-white text-xs border rounded-sm focus:outline-none"
            style={{ borderColor: 'rgba(43,38,32,.2)' }}
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <button
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className="md:hidden text-xs tracking-[.15em] uppercase font-medium flex items-center gap-2 min-h-[40px] px-3 bg-white border rounded-sm"
            style={{ borderColor: 'rgba(43,38,32,.2)' }}
          >
            Filters
          </button>
          <span className="text-xs opacity-60">{totalCount} Products</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-10">
        <aside className={`${mobileFiltersOpen ? 'block' : 'hidden'} md:block md:w-64 shrink-0 space-y-8 p-5 md:p-0 border md:border-none rounded-sm`} style={{ borderColor: 'rgba(43,38,32,.15)' }}>
          <div>
            <p className="text-xs tracking-[.2em] uppercase opacity-60 mb-3">Category</p>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="shopCategory"
                  checked={activeCategory === ''}
                  onChange={() => update({ category: undefined })}
                />
                <span>All Categories ({totalCount})</span>
              </label>
              {categories.map((c) => (
                <label key={c.slug} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="shopCategory"
                    checked={activeCategory === c.slug}
                    onChange={() => update({ category: c.slug })}
                  />
                  <span>{c.name} ({c.productCount})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[.2em] uppercase opacity-60 mb-3">Collections</p>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeNewArrival}
                  onChange={() => update({ newArrival: activeNewArrival ? undefined : 'true' })}
                />
                <span>New Arrivals</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeBestSeller}
                  onChange={() => update({ bestSeller: activeBestSeller ? undefined : 'true' })}
                />
                <span>Best Sellers</span>
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[.2em] uppercase opacity-60 mb-3">Max Price</p>
            <input
              type="range"
              min={MAX_PRICE_FLOOR}
              max={MAX_PRICE_CEILING}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'var(--gold-deep)' }}
            />
            <div className="flex justify-between text-xs opacity-60 mt-2">
              <span>₹{MAX_PRICE_FLOOR.toLocaleString('en-IN')}</span>
              <span>{maxPrice >= MAX_PRICE_CEILING ? `Up to ₹${MAX_PRICE_CEILING.toLocaleString('en-IN')}` : `Up to ₹${maxPrice.toLocaleString('en-IN')}`}</span>
            </div>
          </div>

          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="btn-luxury btn-gold w-full justify-center min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Reset Filters</span>
          </button>
        </aside>

        <div className="flex-1">{children}</div>
      </div>
    </>
  );
}

export function SortSelect() {
  const searchParams = useSearchParams();
  const update = useUpdateParams();

  return (
    <select
      value={searchParams.get('sort') ?? 'featured'}
      onChange={(e) => update({ sort: e.target.value })}
      className="text-xs tracking-[.1em] uppercase border px-3 py-2 bg-transparent"
      style={{ borderColor: 'rgba(43,38,32,.25)' }}
    >
      <option value="featured">Sort: Featured</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="newest">Newest First</option>
    </select>
  );
}

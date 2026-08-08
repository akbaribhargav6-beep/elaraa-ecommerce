'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO } from '@elaraa/shared';
import { getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useSafeAddToCart } from '@/lib/use-safe-cart-actions';
import { Button } from '@/components/ui/Button';

// Interactive "spotlight stage": click a card on the right to feature it on
// the left, matching the reference design's selector pattern — but driven
// entirely by real product data instead of a hardcoded product list.
export function NewArrivalsSpotlight({ products }: { products: ProductDTO[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const addToCart = useSafeAddToCart();
  const [adding, setAdding] = useState(false);

  const active = products[activeIndex];
  if (!active) return null;

  const primaryImage = active.images[0];
  const hoverImage = active.images[1] ?? active.images[0];
  const defaultVariant = active.variants.find((v) => v.isDefault) ?? active.variants[0];

  async function handleAdd() {
    if (!defaultVariant || adding) return;
    setAdding(true);
    try {
      await addToCart(active.id, defaultVariant.id, 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Featured stage */}
      <div className="lg:col-span-7 bg-white border rounded-sm p-6 sm:p-8 shadow-xl relative group" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          <span className="text-[10px] tracking-[.25em] uppercase font-semibold" style={{ color: 'var(--gold-deep)' }}>
            {String(activeIndex + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')} New Edition
          </span>
          <span className="text-[9px] tracking-[.25em] font-bold text-white px-2.5 py-1 rounded-sm uppercase" style={{ background: '#b45309' }}>
            Just Landed
          </span>
        </div>

        <Link href={`/product/${active.slug}`} className="relative block w-full aspect-square overflow-hidden bg-cream rounded-sm mb-6 border" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
          {primaryImage && (
            <Image src={getUploadUrl(primaryImage.url)} alt={active.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(min-width:1024px) 50vw, 100vw" />
          )}
        </Link>

        <div className="space-y-3">
          {active.eyebrow && <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: 'var(--gold-deep)' }}>{active.eyebrow}</p>}
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="serif text-3xl sm:text-4xl font-normal">{active.name}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-medium">{formatPrice(active.basePrice)}</span>
              {active.compareAtPrice && <span className="text-sm opacity-40 line-through">{formatPrice(active.compareAtPrice)}</span>}
            </div>
          </div>
          {active.shortDescription && <p className="serif text-sm sm:text-base italic opacity-70 leading-relaxed">&ldquo;{active.shortDescription}&rdquo;</p>}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button variant="gold-solid" className="flex-1 justify-center py-3.5 text-xs" onClick={handleAdd} disabled={adding || !defaultVariant}>
              {adding ? 'Adding…' : `Add ${active.name} to Bag: ${formatPrice(active.basePrice)}`}
            </Button>
            <Button href={`/product/${active.slug}`} className="py-3.5 px-6 text-xs">View Product →</Button>
          </div>
        </div>
      </div>

      {/* Selector list */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] tracking-[.25em] uppercase font-semibold opacity-50">Select a New Arrival ({products.length})</p>
        </div>
        {products.map((p, i) => {
          const thumb = p.images[0];
          const isActive = i === activeIndex;
          return (
            <button
              key={p.id}
              onClick={() => setActiveIndex(i)}
              className="text-left cursor-pointer border-2 rounded-sm p-4 flex items-center gap-4 transition-all duration-300"
              style={isActive ? { background: '#fffbeb', borderColor: '#fbbf24' } : { background: 'white', borderColor: 'rgba(43,38,32,.1)' }}
            >
              <div className="w-20 sm:w-24 aspect-square shrink-0 relative overflow-hidden rounded-sm bg-cream border" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
                {thumb && <Image src={getUploadUrl(thumb.url)} alt={p.name} fill className="object-cover" sizes="96px" />}
              </div>
              <div className="flex-1 min-w-0">
                {p.eyebrow && <span className="text-[9px] tracking-widest uppercase font-medium" style={{ color: 'var(--gold-deep)' }}>{p.eyebrow}</span>}
                <h4 className="serif text-lg truncate font-medium">{p.name}</h4>
                <p className="text-sm font-medium mt-0.5">{formatPrice(p.basePrice)}</p>
              </div>
              <span className="text-xs font-bold shrink-0" style={isActive ? { color: '#b45309' } : { opacity: 0.4 }}>
                {isActive ? '★ Active' : 'Select →'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductDTO } from '@elaraa/shared';
import { getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

type Region = 'west' | 'north' | 'south' | 'east';

interface TestimonialMeta {
  name: string;
  region: Region;
  regionLabel: string;
  quote: string;
  doodle: string;
  rotation: number;
  offsetY: number;
}

const TESTIMONIAL_META: TestimonialMeta[] = [
  { name: 'Ananya R.', region: 'west', regionLabel: 'Maharashtra', quote: 'The kind of jewellery I actually reach for every morning, it just goes with everything.', doodle: 'never taking these off', rotation: -3, offsetY: 10 },
  { name: 'Meera S.', region: 'north', regionLabel: 'Delhi NCR', quote: 'Hasn’t left my ears since the day it arrived, and still looks brand new.', doodle: 'zero tarnish so far', rotation: 2, offsetY: -8 },
  { name: 'Kavya P.', region: 'south', regionLabel: 'Karnataka', quote: 'Packaging alone felt like a gift before I even opened the box.', doodle: 'so obsessed', rotation: -2, offsetY: 14 },
  { name: 'Riya D.', region: 'east', regionLabel: 'West Bengal', quote: 'Wore it to a wedding and got asked where it was from all night.', doodle: 'so many compliments', rotation: 3, offsetY: -6 },
  { name: 'Sneha K.', region: 'west', regionLabel: 'Gujarat', quote: 'Lightweight, comfortable, and it genuinely hasn’t faded after months of wear.', doodle: 'my everyday piece', rotation: -1, offsetY: 8 },
  { name: 'Pooja M.', region: 'north', regionLabel: 'Punjab', quote: 'Gifted it to my sister and now she wants the whole edit for herself.', doodle: 'buying one more', rotation: 2, offsetY: -10 },
  { name: 'Divya T.', region: 'south', regionLabel: 'Tamil Nadu', quote: 'Looks far more premium than what I actually paid for it.', doodle: 'best find this year', rotation: -3, offsetY: 12 },
  { name: 'Arushi N.', region: 'east', regionLabel: 'Odisha', quote: 'Skin friendly finish means I can wear it all day with zero irritation.', doodle: 'finally, no itching', rotation: 1, offsetY: -6 },
];

const REGIONS: { key: 'all' | Region; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'west', label: 'West' },
  { key: 'north', label: 'North' },
  { key: 'south', label: 'South' },
  { key: 'east', label: 'East' },
];

export function TestimonialsGallery({ products }: { products: ProductDTO[] }) {
  const entries = products.slice(0, TESTIMONIAL_META.length).map((product, i) => ({
    product,
    meta: TESTIMONIAL_META[i],
  }));

  const [activeRegion, setActiveRegion] = useState<'all' | Region>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (entries.length === 0) return null;

  const filtered = activeRegion === 'all' ? entries : entries.filter((e) => e.meta.region === activeRegion);
  const active = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  function count(region: 'all' | Region) {
    return region === 'all' ? entries.length : entries.filter((e) => e.meta.region === region).length;
  }

  function selectRegion(region: 'all' | Region) {
    setActiveRegion(region);
    setLightboxIndex(null);
  }

  function go(delta: number) {
    if (lightboxIndex === null || filtered.length === 0) return;
    setLightboxIndex((lightboxIndex + delta + filtered.length) % filtered.length);
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {REGIONS.map((r) => (
          <button
            key={r.key}
            onClick={() => selectRegion(r.key)}
            className={`region-filter-btn px-5 py-2 text-xs tracking-[.2em] uppercase border rounded-full ${
              activeRegion === r.key ? 'active' : 'hover:opacity-70'
            }`}
            style={activeRegion === r.key ? undefined : { borderColor: 'rgba(43,38,32,.2)' }}
          >
            {r.label} <span className="opacity-50">({count(r.key)})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-8 gap-y-20">
        {filtered.map((entry, i) => {
          const img = entry.product.images[0];
          return (
            <button
              key={entry.product.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="polaroid-card text-left p-3 pb-5"
              style={{ transform: `rotate(${entry.meta.rotation}deg) translateY(${entry.meta.offsetY}px)` }}
            >
              <span className="polaroid-tape" aria-hidden="true" />
              <span className="gold-seal-stamp" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" stroke="var(--gold-deep)" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="13" stroke="var(--gold-deep)" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="20" y="24" textAnchor="middle" fontSize="10" fill="var(--gold-deep)" fontFamily="serif">E</text>
                </svg>
              </span>
              <div className="relative aspect-square overflow-hidden">
                {img && (
                  <Image
                    src={getUploadUrl(img.url)}
                    alt={entry.product.name}
                    fill
                    className="object-cover"
                    sizes="(min-width:768px) 22vw, 45vw"
                  />
                )}
                <span className="photo-gloss-overlay" aria-hidden="true" />
              </div>
              <p className="font-handwriting text-xl leading-tight mt-3" style={{ color: 'var(--charcoal)' }}>
                &ldquo;{entry.meta.doodle}&rdquo;
              </p>
              <p className="text-[10px] tracking-[.15em] uppercase mt-2 opacity-50">
                {entry.meta.name} &middot; {entry.meta.regionLabel}
              </p>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
          style={{ background: 'rgba(23,20,15,.85)' }}
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-3xl w-full rounded-sm overflow-hidden grid md:grid-cols-2 shadow-2xl"
            style={{ background: 'var(--ivory)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square md:aspect-auto">
              {active.product.images[0] && (
                <Image
                  src={getUploadUrl(active.product.images[0].url)}
                  alt={active.product.name}
                  fill
                  className="object-cover"
                  sizes="(min-width:768px) 50vw, 100vw"
                />
              )}
            </div>
            <div className="p-8 md:p-10 flex flex-col">
              <p className="font-handwriting text-3xl leading-tight" style={{ color: 'var(--charcoal)' }}>
                &ldquo;{active.meta.quote}&rdquo;
              </p>
              <p className="text-xs tracking-[.2em] uppercase mt-6 opacity-60">
                {active.meta.name} &middot; {active.meta.regionLabel}
              </p>
              <div className="mt-auto pt-8 border-t" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
                <p className="text-[10px] tracking-[.2em] uppercase opacity-50 mb-1">Wearing</p>
                <Link href={`/product/${active.product.slug}`} className="serif text-lg hover:opacity-70">
                  {active.product.name}
                </Link>
                <p className="text-sm opacity-60 mt-1">{formatPrice(active.product.basePrice)}</p>
              </div>
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 hover:bg-white transition-colors"
            >
              &#10005;
            </button>
            {filtered.length > 1 && (
              <>
                <button
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 hover:bg-white transition-colors"
                >
                  &#8592;
                </button>
                <button
                  onClick={() => go(1)}
                  aria-label="Next"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 hover:bg-white transition-colors"
                >
                  &#8594;
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

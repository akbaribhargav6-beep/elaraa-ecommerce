'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO } from '@elaraa/shared';
import { getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useSafeAddToCart } from '@/lib/use-safe-cart-actions';

const START_SECONDS = 8 * 3600 + 42 * 60 + 19;

// Purely decorative countdown: loops on a fixed clock to convey urgency,
// does not gate or expire any real offer.
function useDecorativeCountdown() {
  const [remaining, setRemaining] = useState(START_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => (prev <= 0 ? START_SECONDS : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const hours = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    mins: String(mins).padStart(2, '0'),
    secs: String(secs).padStart(2, '0'),
  };
}

export function FeaturedLuxuryDeal({ product }: { product: ProductDTO }) {
  const { hours, mins, secs } = useDecorativeCountdown();
  const addToCart = useSafeAddToCart();
  const [adding, setAdding] = useState(false);
  const primary = product.images[0];
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const savings = product.compareAtPrice ? product.compareAtPrice - product.basePrice : 0;

  return (
    <div className="bg-white/80 backdrop-blur-xl border rounded-sm shadow-2xl p-6 sm:p-10 md:p-16 relative overflow-hidden" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
        <div className="lg:col-span-6 group relative aspect-square sm:aspect-[4/3] lg:aspect-square bg-cream overflow-hidden rounded-sm border shadow-md" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
          {primary && (
            <Image src={getUploadUrl(primary.url)} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(min-width:1024px) 40vw, 90vw" />
          )}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[.25em] uppercase font-medium px-3.5 py-1.5 rounded-sm shadow-lg" style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#E6B84D' }} />
              Featured Promo
            </span>
            {product.compareAtPrice && (
              <span className="text-white text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase" style={{ background: 'var(--gold-deep)' }}>
                Limited Price
              </span>
            )}
          </div>
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3.5 py-1.5 text-[10px] tracking-widest uppercase font-medium border" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
            ★ Anti Tarnish Guarantee &middot; Insured Express Courier
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div>
            <p className="text-[10px] tracking-[.3em] uppercase font-medium" style={{ color: 'var(--gold-deep)' }}>Featured Luxury Offer</p>
            <h2 className="serif text-3xl sm:text-4xl md:text-5xl mt-1 leading-tight">{product.name}</h2>
            {product.shortDescription && (
              <p className="text-xs sm:text-sm opacity-70 font-light mt-3 leading-relaxed">{product.shortDescription}</p>
            )}
          </div>

          <div className="p-4 border rounded-sm flex items-center justify-between" style={{ borderColor: 'rgba(43,38,32,.1)', background: 'var(--cream)' }}>
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-widest font-medium">Special Promotional Price</p>
              <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                <span className="text-3xl font-semibold">{formatPrice(product.basePrice)}</span>
                {product.compareAtPrice && <span className="text-sm opacity-40 line-through">{formatPrice(product.compareAtPrice)}</span>}
                {savings > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: 'var(--gold-deep)', background: 'rgba(201,166,107,.18)' }}>
                    You Save {formatPrice(savings)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] opacity-60 block uppercase tracking-widest">Availability</span>
              <span className="text-xs font-medium" style={{ color: 'var(--gold-deep)' }}>Limited Stock</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] tracking-[.2em] opacity-60 uppercase font-medium">Offer Highlighted For:</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ v: hours, l: 'Hours' }, { v: mins, l: 'Minutes' }, { v: secs, l: 'Seconds' }].map((t) => (
                <div key={t.l} className="p-3 rounded-sm" style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
                  <span className="serif text-2xl sm:text-3xl font-light block">{t.v}</span>
                  <span className="text-[9px] tracking-widest opacity-60 uppercase">{t.l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={async () => {
                if (!defaultVariant || adding) return;
                setAdding(true);
                try {
                  await addToCart(product.id, defaultVariant.id, 1);
                } finally {
                  setAdding(false);
                }
              }}
              disabled={!defaultVariant || adding}
              className="btn-luxury btn-gold-solid w-full sm:w-auto h-13 px-8 justify-center text-xs tracking-widest disabled:opacity-40"
            >
              <span>{adding ? 'Adding…' : `Add To Bag · ${formatPrice(product.basePrice)} →`}</span>
            </button>
            <Link href={`/product/${product.slug}`} className="btn-luxury w-full sm:w-auto h-13 px-6 justify-center text-xs">
              <span>View Product Specs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

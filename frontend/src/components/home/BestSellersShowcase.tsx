'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO } from '@elaraa/shared';
import { getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useWishlist } from '@/lib/wishlist-context';
import { useSafeAddToCart, useSafeWishlistToggle } from '@/lib/use-safe-cart-actions';

function HeroCard({ product, rank }: { product: ProductDTO; rank: number }) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const secondary = product.images.find((i) => i.id !== primary?.id) ?? primary;
  const addToCart = useSafeAddToCart();
  const toggleWishlist = useSafeWishlistToggle();
  const { isWishlisted } = useWishlist();
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const wishlisted = isWishlisted(product.id);
  const [adding, setAdding] = useState(false);

  return (
    <div className="md:col-span-7 group relative bg-white border rounded-sm p-8 flex flex-col justify-between overflow-hidden shadow-lg transition-all duration-700 hover:shadow-2xl" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(216,183,126,0.18) 0%, transparent 65%)' }}
      />
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[10px] tracking-[.25em] uppercase font-medium px-3 py-1 rounded-sm" style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
          #{rank} Best Seller
        </span>
        <button
          onClick={() => toggleWishlist(product.id, defaultVariant?.id)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="w-10 h-10 rounded-full bg-stone-100/80 backdrop-blur-md flex items-center justify-center shadow-sm transition-colors"
          style={{ color: wishlisted ? '#dc2626' : undefined }}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>

      <div className="relative w-full aspect-[4/3] my-6 overflow-hidden flex items-center justify-center">
        <Link href={`/product/${product.slug}`} className="w-full h-full block relative overflow-hidden">
          {primary && (
            <Image src={getUploadUrl(primary.url)} alt={product.name} fill className="object-cover transition-all duration-700 group-hover:opacity-0 group-hover:scale-105" sizes="(min-width:768px) 45vw, 100vw" />
          )}
          {secondary && secondary.id !== primary?.id && (
            <Image src={getUploadUrl(secondary.url)} alt={`${product.name} detail`} fill className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" sizes="(min-width:768px) 45vw, 100vw" />
          )}
        </Link>
      </div>

      <div className="relative z-10 pt-4 border-t flex items-end justify-between gap-4" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
        <div>
          {product.material && <p className="text-[10px] tracking-[.2em] uppercase font-medium" style={{ color: 'var(--gold-deep)' }}>{product.material}</p>}
          <h3 className="serif text-2xl sm:text-3xl mt-0.5">
            <Link href={`/product/${product.slug}`} className="hover:opacity-70 transition-opacity">{product.name}</Link>
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-medium">{formatPrice(product.basePrice)}</span>
            {product.compareAtPrice && <span className="text-xs opacity-40 line-through">{formatPrice(product.compareAtPrice)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
            className="btn-luxury btn-gold-solid h-11 px-5 justify-center text-[11px] disabled:opacity-40"
          >
            <span>{adding ? 'Adding…' : 'Quick Add'}</span>
          </button>
          <Link href={`/product/${product.slug}`} className="w-11 h-11 border flex items-center justify-center text-lg hover:bg-black hover:text-white transition-colors" style={{ borderColor: 'var(--black)' }}>
            →
          </Link>
        </div>
      </div>
    </div>
  );
}

function SupportingCard({ product }: { product: ProductDTO }) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const secondary = product.images.find((i) => i.id !== primary?.id) ?? primary;
  const addToCart = useSafeAddToCart();
  const toggleWishlist = useSafeWishlistToggle();
  const { isWishlisted } = useWishlist();
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const wishlisted = isWishlisted(product.id);
  const [adding, setAdding] = useState(false);

  return (
    <div className="group relative bg-white border rounded-sm p-4 sm:p-5 flex items-center gap-5 transition-all duration-500 hover:shadow-xl" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
      <Link href={`/product/${product.slug}`} className="w-28 sm:w-32 aspect-square shrink-0 overflow-hidden relative rounded-sm bg-cream border" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
        {primary && (
          <Image src={getUploadUrl(primary.url)} alt={product.name} fill className="object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-105" sizes="128px" />
        )}
        {secondary && secondary.id !== primary?.id && (
          <Image src={getUploadUrl(secondary.url)} alt={`${product.name} detail`} fill className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" sizes="128px" />
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 gap-2">
          {product.material && <span className="text-[9px] tracking-widest uppercase font-medium truncate" style={{ color: 'var(--gold-deep)' }}>{product.material}</span>}
          <button
            onClick={() => toggleWishlist(product.id, defaultVariant?.id)}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="text-sm shrink-0 transition-colors"
            style={{ color: wishlisted ? '#dc2626' : undefined }}
          >
            {wishlisted ? '♥' : '♡'}
          </button>
        </div>
        <h3 className="serif text-xl truncate">
          <Link href={`/product/${product.slug}`} className="hover:opacity-70 transition-opacity">{product.name}</Link>
        </h3>
        <p className="text-sm font-medium mt-0.5">{formatPrice(product.basePrice)}</p>
        <div className="mt-3 flex items-center gap-3">
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
            className="btn-luxury py-1.5 px-3.5 text-[10px] tracking-widest disabled:opacity-40"
          >
            <span>{adding ? 'Adding…' : '+ Add To Bag'}</span>
          </button>
          <Link href={`/product/${product.slug}`} className="text-xs opacity-60 hover:opacity-100 underline underline-offset-4">Details</Link>
        </div>
      </div>
    </div>
  );
}

export function BestSellersShowcase({ products }: { products: ProductDTO[] }) {
  if (products.length === 0) return null;
  const [hero, ...rest] = products;
  const supporting = rest.slice(0, 3);

  return (
    <>
      {/* Desktop asymmetrical layout */}
      <div className="hidden md:grid grid-cols-12 gap-8 items-stretch">
        <HeroCard product={hero} rank={1} />
        <div className="col-span-5 flex flex-col gap-6 justify-between">
          {supporting.map((p) => (
            <SupportingCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* Mobile swipeable carousel */}
      <div className="flex md:hidden gap-4 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 -mx-6 px-6">
        {products.slice(0, 4).map((p, i) => {
          const img = p.images[0];
          return (
            <div key={p.id} className="min-w-[85vw] snap-center bg-white border p-5 rounded-sm shadow-md" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
              <div className="relative aspect-square overflow-hidden bg-cream mb-4 rounded-sm">
                {i === 0 && (
                  <span className="absolute top-2 left-2 z-10 text-[9px] uppercase tracking-widest px-2 py-0.5 font-medium" style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
                    #1 Best Seller
                  </span>
                )}
                {img && <Image src={getUploadUrl(img.url)} alt={p.name} fill className="object-cover" sizes="85vw" />}
              </div>
              {p.material && <p className="text-[10px] tracking-widest uppercase font-medium" style={{ color: 'var(--gold-deep)' }}>{p.material}</p>}
              <h3 className="serif text-2xl mt-0.5">{p.name}</h3>
              <p className="text-lg font-medium mt-1">{formatPrice(p.basePrice)}</p>
              <Link href={`/product/${p.slug}`} className="btn-luxury btn-gold-solid w-full mt-4 justify-center py-3 text-xs">
                <span>View Product →</span>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}

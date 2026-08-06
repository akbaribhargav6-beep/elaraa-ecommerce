'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO } from '@elaraa/shared';
import { getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';

const BADGE_LABELS = ['Anti Tarnish', 'Premium Finish', 'Handcrafted', 'Everyday Wear'];

function EarringCard({ product, badge, staggered }: { product: ProductDTO; badge: string; staggered: boolean }) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const secondary = product.images.find((i) => i.id !== primary?.id) ?? primary;
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const wishlisted = isWishlisted(product.id);

  return (
    <div
      className={`group relative bg-white border rounded-sm p-5 shadow-sm hover:shadow-2xl transition-all duration-500 ${staggered ? 'lg:translate-y-8' : ''}`}
      style={{ borderColor: 'rgba(43,38,32,.1)' }}
    >
      <div className="relative w-full aspect-square overflow-hidden bg-cream rounded-sm mb-5 border" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
        <Link href={`/product/${product.slug}`} className="block w-full h-full relative">
          {primary && (
            <Image src={getUploadUrl(primary.url)} alt={product.name} fill className="object-cover transition-all duration-700 group-hover:scale-105" sizes="(min-width:1024px) 24vw, (min-width:640px) 45vw, 90vw" />
          )}
          {secondary && secondary.id !== primary?.id && (
            <Image src={getUploadUrl(secondary.url)} alt={`${product.name} detail`} fill className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" sizes="(min-width:1024px) 24vw, (min-width:640px) 45vw, 90vw" />
          )}
        </Link>
        <span className="absolute top-3 left-3 z-10 text-[9px] tracking-[.2em] uppercase font-medium px-2.5 py-1 rounded-sm shadow-sm" style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
          {badge}
        </span>
        <button
          onClick={() => toggle(product.id, defaultVariant?.id)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-sm transition-colors"
          style={{ color: wishlisted ? '#dc2626' : undefined }}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>

      <div className="space-y-1.5">
        {product.material && <p className="text-[9px] tracking-widest uppercase font-medium" style={{ color: 'var(--gold-deep)' }}>{product.material}</p>}
        <h3 className="serif text-2xl font-normal">
          <Link href={`/product/${product.slug}`} className="hover:opacity-70 transition-opacity">{product.name}</Link>
        </h3>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-lg font-medium">{formatPrice(product.basePrice)}</span>
          {product.compareAtPrice && <span className="text-xs opacity-40 line-through">{formatPrice(product.compareAtPrice)}</span>}
        </div>
      </div>

      <button
        onClick={() => defaultVariant && addItem(product.id, defaultVariant.id, 1)}
        disabled={!defaultVariant}
        className="btn-luxury btn-gold-solid w-full mt-5 justify-center py-2.5 text-[11px] tracking-widest disabled:opacity-40"
      >
        <span>+ Add To Bag</span>
      </button>
    </div>
  );
}

export function SignatureEarringsGrid({ products }: { products: ProductDTO[] }) {
  if (products.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
      {products.slice(0, 4).map((p, i) => (
        <EarringCard key={p.id} product={p} badge={BADGE_LABELS[i % BADGE_LABELS.length]} staggered={i % 2 === 1} />
      ))}
    </div>
  );
}

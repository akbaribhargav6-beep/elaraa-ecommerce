'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO } from '@elaraa/shared';
import { getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart-context';
import { useWishlist } from '@/lib/wishlist-context';
import { useQuickView } from '@/lib/quick-view-context';

// Ports .card-luxury verbatim: primary/secondary image cross-fade on hover,
// a category badge, a wishlist toggle, a working Quick View modal trigger,
// and a "+ Bag" quick-add — all wired to the real cart/wishlist APIs.
export function ProductCard({ product }: { product: ProductDTO }) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const secondary = product.images.find((i) => i.id !== primary?.id) ?? primary;
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { openQuickView } = useQuickView();

  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const wishlisted = isWishlisted(product.id);
  const categoryLabel = product.categorySlug.charAt(0).toUpperCase() + product.categorySlug.slice(1);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (defaultVariant) addItem(product.id, defaultVariant.id, 1);
  }

  function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault();
    toggle(product.id, defaultVariant?.id);
  }

  function handleQuickView(e: React.MouseEvent) {
    e.preventDefault();
    openQuickView(product.slug);
  }

  return (
    <div className="card-luxury">
      <Link href={`/product/${product.slug}`} className="img-wrap aspect-square block relative overflow-hidden bg-cream">
        {primary && (
          <Image
            src={getUploadUrl(primary.url)}
            alt={primary.altText ?? product.name}
            fill
            className="img-primary object-cover"
            sizes="(min-width: 768px) 33vw, 50vw"
          />
        )}
        {secondary && secondary.id !== primary?.id && (
          <Image
            src={getUploadUrl(secondary.url)}
            alt={secondary.altText ?? product.name}
            fill
            className="img-secondary object-cover"
            sizes="(min-width: 768px) 33vw, 50vw"
          />
        )}

        <span className="absolute top-3 left-3 z-10 bg-[#17140F]/80 text-[#F8F5F0] text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm pointer-events-none backdrop-blur-sm">
          {categoryLabel}
        </span>

        <button
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-sm shadow-md hover:bg-red-50 transition-colors"
          style={{ color: wishlisted ? '#dc2626' : '#2B2620' }}
        >
          {wishlisted ? '♥' : '♡'}
        </button>

        <button onClick={handleQuickView} className="card-cta btn-luxury bg-white/90">
          <span>Quick View</span>
        </button>
      </Link>
      <div className="pt-5 flex items-start justify-between">
        <div>
          <h3 className="serif text-xl">{product.name}</h3>
          {product.material && <p className="text-xs opacity-60 mt-1">{product.material}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm">{formatPrice(product.basePrice)}</p>
          {product.compareAtPrice && (
            <p className="text-xs opacity-50 line-through">{formatPrice(product.compareAtPrice)}</p>
          )}
        </div>
      </div>
      <button
        onClick={handleQuickAdd}
        disabled={!defaultVariant || defaultVariant.stockQuantity <= 0}
        className="text-[11px] uppercase tracking-wider font-medium mt-2 underline decoration-stone-300 underline-offset-4 hover:opacity-70 disabled:opacity-30"
      >
        + Bag
      </button>
    </div>
  );
}

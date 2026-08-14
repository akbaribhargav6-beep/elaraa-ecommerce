'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductDTO } from '@elaraa/shared';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useWishlist } from '@/lib/wishlist-context';
import { useToast } from '@/lib/toast-context';
import { formatPrice } from '@/lib/format';
import { QtyBox } from '@/components/ui/QtyBox';
import { Button } from '@/components/ui/Button';
import { NotifyMeModal } from '@/components/product/NotifyMeModal';

// Same concierge WhatsApp number used on the Contact page.
const WHATSAPP_NUMBER = '919213473062';

export function ProductPurchasePanel({ product }: { product: ProductDTO }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const { notify } = useToast();
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  const metals = useMemo(
    () => [...new Map(product.variants.map((v) => [v.metalLabel, v])).values()],
    [product.variants]
  );
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];

  const [selectedMetal, setSelectedMetal] = useState(defaultVariant?.metalLabel ?? metals[0]?.metalLabel);
  const backTypes = useMemo(
    () => [
      ...new Set(
        product.variants
          .filter((v) => v.metalLabel === selectedMetal)
          .map((v) => v.backType)
          .filter((bt): bt is string => Boolean(bt))
      ),
    ],
    [product.variants, selectedMetal]
  );
  // Variants store "no back type"/"no size" as null (Prisma), but a fresh
  // useState default falls through to undefined — normalizing both selection
  // states to `string | null` keeps every `v.backType === selectedBackType`
  // comparison meaningful for products that don't use that axis at all,
  // instead of comparing null to undefined and silently never matching.
  const [selectedBackType, setSelectedBackType] = useState<string | null>(
    defaultVariant?.backType ?? backTypes[0] ?? null
  );

  const sizes = useMemo(
    () => [
      ...new Set(
        product.variants
          .filter((v) => v.metalLabel === selectedMetal && v.backType === selectedBackType)
          .map((v) => v.size)
          .filter((s): s is string => Boolean(s))
      ),
    ],
    [product.variants, selectedMetal, selectedBackType]
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(defaultVariant?.size ?? sizes[0] ?? null);

  const selectedVariant =
    product.variants.find(
      (v) => v.metalLabel === selectedMetal && v.backType === selectedBackType && v.size === selectedSize
    ) ??
    product.variants.find((v) => v.metalLabel === selectedMetal && v.backType === selectedBackType) ??
    product.variants.find((v) => v.metalLabel === selectedMetal) ??
    defaultVariant;

  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const outOfStock = !selectedVariant || selectedVariant.stockQuantity <= 0;
  const wishlisted = isWishlisted(product.id);
  const price = selectedVariant?.price ?? product.basePrice;
  const savingsPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - price) / product.compareAtPrice) * 100)
    : null;

  function selectMetal(metalLabel: string) {
    setSelectedMetal(metalLabel);
    const stillValidBackType = product.variants.some((v) => v.metalLabel === metalLabel && v.backType === selectedBackType);
    const nextBackType = stillValidBackType
      ? selectedBackType
      : (product.variants.find((v) => v.metalLabel === metalLabel)?.backType ?? null);
    if (!stillValidBackType) setSelectedBackType(nextBackType);

    const stillValidSize = product.variants.some(
      (v) => v.metalLabel === metalLabel && v.backType === nextBackType && v.size === selectedSize
    );
    if (!stillValidSize) {
      const firstSize = product.variants.find((v) => v.metalLabel === metalLabel && v.backType === nextBackType)?.size;
      setSelectedSize(firstSize ?? null);
    }
  }

  function selectBackType(backType: string) {
    setSelectedBackType(backType);
    const stillValidSize = product.variants.some(
      (v) => v.metalLabel === selectedMetal && v.backType === backType && v.size === selectedSize
    );
    if (!stillValidSize) {
      const firstSize = product.variants.find((v) => v.metalLabel === selectedMetal && v.backType === backType)?.size;
      setSelectedSize(firstSize ?? null);
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await addItem(product.id, selectedVariant.id, qty);
    } catch {
      notify("Couldn't add this to your bag — please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    if (!selectedVariant) return;
    setBuyingNow(true);
    try {
      await addItem(product.id, selectedVariant.id, qty);
      router.push('/checkout');
    } catch {
      notify("Couldn't start checkout — please try again.");
    } finally {
      setBuyingNow(false);
    }
  }

  async function handleWishlist() {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (togglingWishlist) return;
    setTogglingWishlist(true);
    try {
      await toggle(product.id, selectedVariant?.id);
    } catch {
      notify('Something went wrong updating your wishlist.');
    } finally {
      setTogglingWishlist(false);
    }
  }

  function handleBulkInquiry() {
    const message = `Hello, I'm interested in bulk purchasing this product.\n\nProduct: ${product.name}\nLink: ${window.location.href}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${product.name} | ELARAA`, url });
      } catch {
        // user cancelled the share sheet — no action needed
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  function checkPincode(e: React.FormEvent) {
    e.preventDefault();
    if (/^\d{6}$/.test(pincode.trim())) {
      setPincodeResult('valid');
    } else {
      setPincodeResult('invalid');
    }
  }

  return (
    <>
    <div>
      <div className="flex items-center justify-between mb-1">
        {product.eyebrow && <p className="eyebrow">{product.eyebrow}</p>}
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{
            background: outOfStock ? '#fee2e2' : 'rgba(168,130,61,.15)',
            color: outOfStock ? '#991b1b' : 'var(--gold-deep)',
          }}
        >
          {outOfStock ? 'Out of Stock' : 'In Stock'}
        </span>
      </div>

      <h1 className="serif text-4xl md:text-5xl mt-1">{product.name}</h1>

      {product.reviewCount > 0 && (
        <div className="flex items-center gap-3 mt-3 text-xs opacity-70">
          <span style={{ color: 'var(--gold-deep)' }}>
            {'★'.repeat(Math.round(product.avgRating))}
            {'☆'.repeat(5 - Math.round(product.avgRating))}
          </span>
          <span className="font-medium opacity-100">{product.avgRating.toFixed(1)} / 5.0</span>
          <span className="opacity-40">•</span>
          <a href="#reviews" className="underline underline-offset-4 hover:opacity-100">
            {product.reviewCount} Verified Buyer Reviews
          </a>
        </div>
      )}

      <div className="flex items-baseline gap-3 mt-4">
        <span className="text-2xl md:text-3xl font-medium" style={{ color: 'var(--charcoal)' }}>
          {formatPrice(price)}
        </span>
        {product.compareAtPrice && (
          <span className="text-sm opacity-50 line-through">{formatPrice(product.compareAtPrice)}</span>
        )}
        {savingsPercent !== null && savingsPercent > 0 && (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-sm uppercase tracking-wider"
            style={{ background: 'rgba(168,130,61,.15)', color: 'var(--gold-deep)' }}
          >
            Save {savingsPercent}%
          </span>
        )}
      </div>
      <p className="text-[11px] opacity-50 mt-1">Inclusive of all taxes • Free Insured Delivery across India</p>

      {product.description && <p className="text-sm opacity-70 mt-6 leading-relaxed">{product.description}</p>}

      {metals.length > 0 && (
        <div className="mt-8">
          <p className="text-xs tracking-[.2em] uppercase opacity-60 mb-3">
            Metal Finish: <span className="opacity-100">{selectedMetal}</span>
          </p>
          <div className="flex gap-3">
            {metals.map((v) => (
              <button
                key={v.metalLabel}
                onClick={() => selectMetal(v.metalLabel)}
                className="w-10 h-10 rounded-full border-2 p-0.5"
                style={{ borderColor: v.metalLabel === selectedMetal ? 'var(--black)' : 'transparent' }}
                aria-label={v.metalLabel}
              >
                <span className="w-full h-full rounded-full block" style={{ background: v.metalHex ?? '#C9A66B' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {backTypes.length > 0 && (
        <div className="mt-6">
          <p className="text-xs tracking-[.2em] uppercase opacity-60 mb-3">
            Fastening Type: <span className="opacity-100">{selectedBackType}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {backTypes.map((bt) => {
              const variantForType = product.variants.find((v) => v.metalLabel === selectedMetal && v.backType === bt);
              const addon = variantForType && variantForType.price > product.basePrice ? variantForType.price - product.basePrice : 0;
              return (
                <button
                  key={bt}
                  onClick={() => selectBackType(bt)}
                  className="py-2.5 px-4 text-xs tracking-wider border font-medium transition-colors"
                  style={
                    bt === selectedBackType
                      ? { borderColor: 'var(--black)', background: 'var(--black)', color: 'var(--ivory)' }
                      : { borderColor: 'rgba(43,38,32,.3)' }
                  }
                >
                  {bt}
                  {addon > 0 ? ` (+${formatPrice(addon)})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="mt-6">
          <p className="text-xs tracking-[.2em] uppercase opacity-60 mb-3">
            Size: <span className="opacity-100">{selectedSize}</span>
          </p>
          <div className="grid grid-cols-4 gap-3">
            {sizes.map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                className="py-2.5 px-3 text-xs tracking-wider border font-medium transition-colors"
                style={
                  sz === selectedSize
                    ? { borderColor: 'var(--black)', background: 'var(--black)', color: 'var(--ivory)' }
                    : { borderColor: 'rgba(43,38,32,.3)' }
                }
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-6">
        {outOfStock ? (
          <button onClick={() => setNotifyOpen(true)} className="btn-luxury btn-gold-solid w-full justify-center h-12">
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
              </svg>
              <span>Notify Me When Available</span>
            </span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <QtyBox value={qty} onChange={setQty} max={selectedVariant?.stockQuantity ?? 1} />
              <Button variant="gold-solid" className="flex-1 justify-center h-12" onClick={handleAddToCart} disabled={adding || buyingNow}>
                {adding ? 'Adding…' : `Add to Bag | ${formatPrice(price)}`}
              </Button>
            </div>
            <Button className="w-full justify-center h-12" onClick={handleBuyNow} disabled={adding || buyingNow}>
              {buyingNow ? 'Redirecting…' : 'Buy Now | Instant Checkout'}
            </Button>
          </>
        )}
        <button onClick={handleBulkInquiry} className="btn-luxury w-full justify-center h-12">
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.3-.8.8-.8 1.9s.8 2.2 1 2.4c.1.1 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.5.1 1 .1 1.4.1.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1z" />
              <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.6 1.4 5.1L2 22l5-1.3c1.4.8 3.1 1.2 4.9 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.6 0-3.2-.4-4.6-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4 15.1 3.5 13.6 3.5 12c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5-3.8 8.3-8.5 8.3z" />
            </svg>
            <span>Bulk Inquiry on WhatsApp</span>
          </span>
        </button>

        <div className="flex items-center justify-between pt-1 text-xs">
          <button onClick={handleWishlist} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-colors py-1" style={wishlisted ? { color: '#dc2626' } : undefined}>
            <span>{wishlisted ? '♥' : '♡'}</span>
            <span>{wishlisted ? 'In Your Wishlist' : 'Add to Wishlist'}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-colors py-1">
            <span>↗</span>
            <span>Share</span>
          </button>
        </div>
      </div>

      <form onSubmit={checkPincode} className="mt-6 p-4 space-y-2 text-xs" style={{ background: 'var(--cream)', border: '1px solid rgba(43,38,32,.1)' }}>
        <div className="flex items-center justify-between">
          <span className="font-medium">📍 Check Delivery Availability</span>
          <span className="text-[10px]" style={{ color: '#047857' }}>Free Insured Shipping</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            className="flex-1 px-3 py-2 bg-white border text-xs outline-none"
            style={{ borderColor: 'rgba(43,38,32,.2)' }}
          />
          <button type="submit" className="px-4 py-2 text-[11px] tracking-wider uppercase font-medium" style={{ background: 'var(--black)', color: 'var(--ivory)' }}>
            Check
          </button>
        </div>
        {pincodeResult === 'valid' && (
          <p style={{ color: '#047857' }}>
            ✓ We deliver to {pincode}. Orders typically arrive in 3 to 5 business days, with Cash on Delivery available.
          </p>
        )}
        {pincodeResult === 'invalid' && <p style={{ color: '#b91c1c' }}>Please enter a valid 6-digit pincode.</p>}
      </form>

      <div className="grid grid-cols-3 gap-2 text-center text-[10px] opacity-70 mt-4">
        {[
          { icon: '👑', label: 'Anti Tarnish', sub: '100% Quality Guaranteed' },
          { icon: '↺', label: '14-Day Returns', sub: 'Easy Doorstep Pickup' },
          { icon: '🛡️', label: 'Lifetime Care', sub: 'Free Annual Polish' },
        ].map((b) => (
          <div key={b.label} className="p-2" style={{ background: 'rgba(255,255,255,.6)', border: '1px solid rgba(43,38,32,.08)' }}>
            <div className="text-sm mb-0.5">{b.icon}</div>
            <p className="font-medium" style={{ color: 'var(--charcoal)' }}>{b.label}</p>
            <p className="opacity-75">{b.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-0">
        <details className="py-4 border-t" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
          <summary className="text-sm cursor-pointer flex items-center justify-between">Specifications <span>+</span></summary>
          <p className="text-sm opacity-70 mt-3">{product.material ?? 'Premium materials, handfinished.'}</p>
        </details>
        <details className="py-4 border-t" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
          <summary className="text-sm cursor-pointer flex items-center justify-between">Shipping & Returns <span>+</span></summary>
          <p className="text-sm opacity-70 mt-3">Ships in 3 to 5 business days. Free returns within 14 days of delivery.</p>
        </details>
      </div>
    </div>
    {notifyOpen && (
      <NotifyMeModal product={product} variantId={selectedVariant?.id} onClose={() => setNotifyOpen(false)} />
    )}
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO } from '@elaraa/shared';
import { api, getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart-context';
import { useQuickView } from '@/lib/quick-view-context';
import { useToast } from '@/lib/toast-context';
import { Button } from '@/components/ui/Button';
import { QtyBox } from '@/components/ui/QtyBox';

// A condensed version of ProductPurchasePanel rendered in a modal, so a
// shopper can add to bag straight from the shop grid without leaving it.
export function QuickViewModal() {
  const { activeSlug, closeQuickView } = useQuickView();
  const { addItem } = useCart();
  const { notify } = useToast();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!activeSlug) {
      setProduct(null);
      setLoadError(false);
      return;
    }
    // A fetch that never resolves (or rejects with nothing catching it) used
    // to leave the modal stuck on "Loading…" forever — this is the actual
    // cause of "Quick View sometimes keeps loading and does not open
    // properly". The `cancelled` guard also stops a slow, stale response
    // from a previously-opened product clobbering whichever one is open now
    // if two Quick Views get triggered in quick succession.
    let cancelled = false;
    setProduct(null);
    setLoadError(false);
    setQty(1);
    api
      .get<{ product: ProductDTO }>(`/api/products/${activeSlug}`)
      .then((data) => {
        if (cancelled) return;
        setProduct(data.product);
        const defaultVariant = data.product.variants.find((v) => v.isDefault) ?? data.product.variants[0];
        setSelectedMetal(defaultVariant?.metalLabel);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeQuickView();
    }
    if (activeSlug) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeSlug, closeQuickView]);

  if (!activeSlug) return null;

  const metals = product ? [...new Map(product.variants.map((v) => [v.metalLabel, v])).values()] : [];
  const selectedVariant = product?.variants.find((v) => v.metalLabel === selectedMetal) ?? product?.variants[0];
  const primaryImage = product?.images[0];

  async function handleAddToCart() {
    if (!product || !selectedVariant) return;
    setAdding(true);
    try {
      await addItem(product.id, selectedVariant.id, qty);
      closeQuickView();
    } catch {
      notify("Couldn't add this to your bag — please try again.");
    } finally {
      setAdding(false);
    }
  }

  function retryLoad() {
    // Re-triggers the load effect by toggling activeSlug through a no-op
    // state change isn't possible from here, so just re-run the same fetch.
    setLoadError(false);
    setProduct(null);
    api
      .get<{ product: ProductDTO }>(`/api/products/${activeSlug}`)
      .then((data) => {
        setProduct(data.product);
        const defaultVariant = data.product.variants.find((v) => v.isDefault) ?? data.product.variants[0];
        setSelectedMetal(defaultVariant?.metalLabel);
      })
      .catch(() => setLoadError(true));
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={closeQuickView}
    >
      <div
        className="bg-white max-w-2xl w-full rounded-sm shadow-2xl relative grid sm:grid-cols-2 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeQuickView}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-stone-600 hover:text-black shadow-md"
        >
          ✕
        </button>

        {loadError ? (
          <div className="sm:col-span-2 p-16 text-center text-sm space-y-4">
            <p className="opacity-60">Couldn&apos;t load this product.</p>
            <button onClick={retryLoad} className="btn-luxury btn-gold text-xs px-5 py-2 inline-flex">
              <span>Try Again</span>
            </button>
          </div>
        ) : !product ? (
          <div className="sm:col-span-2 p-16 text-center text-sm opacity-60">Loading…</div>
        ) : (
          <>
            <div className="relative aspect-square bg-stone-100">
              {primaryImage && (
                <Image src={getUploadUrl(primaryImage.url)} alt={product.name} fill className="object-cover" />
              )}
            </div>

            <div className="p-6 sm:p-8 flex flex-col">
              {product.eyebrow && <p className="eyebrow">{product.eyebrow}</p>}
              <h2 className="serif text-2xl sm:text-3xl mt-2">{product.name}</h2>
              <p className="text-lg mt-3">
                {formatPrice(selectedVariant?.price ?? product.basePrice)}
                {product.compareAtPrice && (
                  <span className="text-sm opacity-50 line-through ml-2">{formatPrice(product.compareAtPrice)}</span>
                )}
              </p>
              {product.shortDescription && (
                <p className="text-sm opacity-70 mt-3 leading-relaxed">{product.shortDescription}</p>
              )}

              {metals.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs tracking-[.2em] uppercase opacity-60 mb-2">
                    Finish: <span className="opacity-100">{selectedMetal}</span>
                  </p>
                  <div className="flex gap-2.5">
                    {metals.map((v) => (
                      <button
                        key={v.metalLabel}
                        onClick={() => setSelectedMetal(v.metalLabel)}
                        className="w-8 h-8 rounded-full border-2"
                        style={{
                          background: v.metalHex ?? '#C9A66B',
                          borderColor: v.metalLabel === selectedMetal ? 'var(--black)' : 'transparent',
                        }}
                        aria-label={v.metalLabel}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mt-6">
                <QtyBox value={qty} onChange={setQty} max={selectedVariant?.stockQuantity ?? 1} />
                <Button
                  variant="gold-solid"
                  className="flex-1 justify-center"
                  onClick={handleAddToCart}
                  disabled={adding || !selectedVariant || selectedVariant.stockQuantity <= 0}
                >
                  {!selectedVariant || selectedVariant.stockQuantity <= 0
                    ? 'Out of Stock'
                    : adding
                      ? 'Adding…'
                      : 'Add to Bag'}
                </Button>
              </div>

              <Link
                href={`/product/${product.slug}`}
                onClick={closeQuickView}
                className="text-xs tracking-[.15em] uppercase opacity-60 hover:opacity-100 mt-4 text-center"
              >
                View Full Details →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

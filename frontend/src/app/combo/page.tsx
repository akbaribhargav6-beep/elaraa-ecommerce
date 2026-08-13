'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ProductDTO, ComboSettingsDTO } from '@elaraa/shared';
import { api, ApiClientError, getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/lib/toast-context';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Footer } from '@/components/layout/Footer';

interface Selection {
  productId: string;
  variantId: string;
  productName: string;
  imageUrl: string | null;
}

export default function ComboPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [settings, setSettings] = useState<ComboSettingsDTO | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { refetch, openDrawer } = useCart();
  const { notify } = useToast();

  useEffect(() => {
    Promise.all([
      api.get<{ giftPackagingFee: number; combo: ComboSettingsDTO }>('/api/settings'),
      api.get<{ items: ProductDTO[] }>('/api/products?comboEligible=true&limit=60'),
    ])
      .then(([settingsData, productsData]) => {
        setSettings(settingsData.combo);
        setProducts(productsData.items);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleSelect(product: ProductDTO) {
    const already = selections.some((s) => s.productId === product.id);
    if (already) {
      setSelections((s) => s.filter((x) => x.productId !== product.id));
      return;
    }
    const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
    if (!defaultVariant) return;
    const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
    setSelections((s) => [
      ...s,
      { productId: product.id, variantId: defaultVariant.id, productName: product.name, imageUrl: primary?.url ?? null },
    ]);
  }

  function removeSelection(productId: string) {
    setSelections((s) => s.filter((x) => x.productId !== productId));
  }

  const minProducts = settings?.minProducts ?? 3;
  const remaining = Math.max(0, minProducts - selections.length);
  const isValid = selections.length >= minProducts;

  async function handleAddCombo() {
    if (!isValid || adding) return;
    setAdding(true);
    try {
      await api.post('/api/cart/combo', {
        selections: selections.map((s) => ({ productId: s.productId, variantId: s.variantId })),
      });
      await refetch();
      openDrawer();
      setSelections([]);
      notify('Your combo has been added to your bag.', 'success');
    } catch (err) {
      notify(err instanceof ApiClientError ? err.message : "Couldn't add your combo — please try again.");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="pt-40 text-center text-sm opacity-60">Loading…</div>;

  if (!settings?.enabled) {
    return (
      <>
        <div className="pt-28" />
        <div className="text-center py-24 px-6">
          <p className="text-sm opacity-60">Combo sets aren&apos;t available right now — check back soon.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="pt-28" />
      <section className={`px-4 sm:px-6 md:px-16 max-w-6xl mx-auto ${selections.length > 0 ? 'pb-40' : 'pb-20'}`}>
        <Eyebrow>Build Your Own</Eyebrow>
        <h1 className="serif text-4xl md:text-5xl mt-2 mb-3">Create Your Combo</h1>
        <p className="text-sm opacity-70 mb-10 max-w-xl">
          Select at least {minProducts} pieces below and get them together for{' '}
          <strong>{formatPrice(settings.price)}</strong> — regardless of their individual prices.
        </p>

        {products.length === 0 ? (
          <p className="text-sm opacity-60">No products are currently available for combo selection.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const selected = selections.some((s) => s.productId === p.id);
              const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
              return (
                <div
                  key={p.id}
                  className="border rounded-sm p-3 bg-white transition-shadow"
                  style={{ borderColor: selected ? 'var(--gold-deep)' : 'rgba(43,38,32,.12)', boxShadow: selected ? '0 0 0 1px var(--gold-deep)' : undefined }}
                >
                  <div className="relative aspect-square bg-cream mb-3 overflow-hidden">
                    {primary && (
                      <Image src={getUploadUrl(primary.url)} alt={p.name} fill className="object-cover" sizes="(min-width:1024px) 22vw, 45vw" />
                    )}
                  </div>
                  <h3 className="serif text-base leading-tight">{p.name}</h3>
                  <p className="text-xs opacity-60 mt-0.5">{formatPrice(p.basePrice)}</p>
                  <button
                    onClick={() => toggleSelect(p)}
                    className="w-full mt-2.5 py-2 text-[11px] tracking-widest uppercase font-medium transition-colors"
                    style={
                      selected
                        ? { background: 'var(--black)', color: 'var(--ivory)' }
                        : { border: '1px solid rgba(43,38,32,.3)' }
                    }
                  >
                    {selected ? '✓ Added to Combo' : 'Select / Add to Combo'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selections.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[95] bg-white border-t shadow-2xl"
          style={{ borderColor: 'rgba(43,38,32,.15)' }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 flex items-center gap-3 overflow-x-auto w-full">
              {selections.map((s) => (
                <div key={s.productId} className="relative shrink-0 w-14 h-14 border" style={{ borderColor: 'rgba(43,38,32,.15)' }}>
                  {s.imageUrl && <Image src={getUploadUrl(s.imageUrl)} alt={s.productName} fill className="object-cover" sizes="56px" />}
                  <button
                    onClick={() => removeSelection(s.productId)}
                    aria-label={`Remove ${s.productName} from combo`}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center shadow-md"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="text-center sm:text-right shrink-0 min-w-[180px]">
              {isValid ? (
                <p className="text-sm font-medium">
                  {selections.length} products selected · <span style={{ color: 'var(--gold-deep)' }}>{formatPrice(settings.price)}</span>
                </p>
              ) : (
                <p className="text-xs opacity-70">
                  Select {remaining} more product{remaining === 1 ? '' : 's'} to create your combo.
                </p>
              )}
            </div>
            <button
              onClick={handleAddCombo}
              disabled={!isValid || adding}
              className="btn-luxury btn-gold-solid shrink-0 disabled:opacity-40"
            >
              <span>{adding ? 'Adding…' : 'Add Combo to Cart'}</span>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

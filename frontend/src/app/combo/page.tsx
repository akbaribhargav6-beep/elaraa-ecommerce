'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { ProductDTO, ComboSettingsDTO } from '@elaraa/shared';
import { api, ApiClientError, getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/lib/toast-context';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Footer } from '@/components/layout/Footer';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';

interface Selection {
  productId: string;
  variantId: string;
  productName: string;
  imageUrl: string | null;
}

const CONFETTI_COLORS = ['#C9A66B', '#FFE8B0', '#9C2B3B', '#E8B4BC', '#F8F5F0'];

function RakhiMotif({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M32 4 C 20 14, 20 22, 32 24 C 44 22, 44 14, 32 4 Z" stroke="#FFE8B0" strokeWidth="1.4" opacity="0.85" />
      <circle cx="32" cy="34" r="13" stroke="#C9A66B" strokeWidth="1.6" opacity="0.9" />
      <circle cx="32" cy="34" r="7" fill="#C9A66B" opacity="0.35" />
      <circle cx="32" cy="34" r="3" fill="#FFE8B0" opacity="0.9" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="32"
          y1="34"
          x2={32 + 20 * Math.cos((deg * Math.PI) / 180)}
          y2={34 + 20 * Math.sin((deg * Math.PI) / 180)}
          stroke="#FFE8B0"
          strokeWidth="0.8"
          opacity="0.4"
        />
      ))}
    </svg>
  );
}

function MandalaRing({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="20" stroke="#FFE8B0" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.6" />
      <circle cx="24" cy="24" r="13" stroke="#C9A66B" strokeWidth="1" opacity="0.55" />
      <circle cx="24" cy="24" r="4" fill="#C9A66B" opacity="0.5" />
    </svg>
  );
}

function FlowerMotif({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="12"
          rx="4.5"
          ry="8"
          fill="#E8B4BC"
          opacity="0.55"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3.2" fill="#FFE8B0" opacity="0.9" />
    </svg>
  );
}

function ConfettiBurst({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<{ id: number; left: number; color: string; delay: number; duration: number; rotate: number }[]>([]);

  useEffect(() => {
    if (!active) return;
    const generated = Array.from({ length: 46 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.4,
      duration: 2.2 + Math.random() * 1.2,
      rotate: Math.random() * 360,
    }));
    setPieces(generated);
    const t = setTimeout(() => setPieces([]), 3600);
    return () => clearTimeout(t);
  }, [active]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="rb-confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function ComboPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [settings, setSettings] = useState<ComboSettingsDTO | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const wasValidRef = useRef(false);
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

  const minProducts = settings?.minProducts ?? 3;
  const remaining = Math.max(0, minProducts - selections.length);
  const isValid = selections.length >= minProducts;
  const progressPct = Math.min(100, Math.round((selections.length / Math.max(1, minProducts)) * 100));

  useEffect(() => {
    if (isValid && !wasValidRef.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 3600);
      wasValidRef.current = true;
      return () => clearTimeout(t);
    }
    wasValidRef.current = isValid;
  }, [isValid]);

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
    setJustSelected(product.id);
    setTimeout(() => setJustSelected((cur) => (cur === product.id ? null : cur)), 450);
  }

  function removeSelection(productId: string) {
    setSelections((s) => s.filter((x) => x.productId !== productId));
  }

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
      wasValidRef.current = false;
      notify('Your Raksha Bandhan combo has been added to your bag.', 'success');
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

  const dotCount = minProducts <= 8 ? minProducts : 0;

  return (
    <>
      <ConfettiBurst active={celebrate} />
      <div className="pt-28" />

      {/* ─────────────────────── Hero ─────────────────────── */}
      <section className="rb-hero px-6 pt-16 pb-24 md:pt-24 md:pb-32 text-center">
        <div className="rb-hero-pattern" />
        <div className="rb-hero-vignette" />

        <div className="rb-float-el" style={{ top: '12%', left: '6%', animationDelay: '0s' }}>
          <RakhiMotif size={56} />
        </div>
        <div className="rb-float-el rb-float-b" style={{ top: '18%', right: '7%', animationDelay: '.6s' }}>
          <RakhiMotif size={72} />
        </div>
        <div className="rb-float-el" style={{ bottom: '14%', left: '11%', animationDelay: '1.1s' }}>
          <FlowerMotif size={36} />
        </div>
        <div className="rb-float-el rb-float-b" style={{ bottom: '10%', right: '13%', animationDelay: '.3s' }}>
          <MandalaRing size={44} />
        </div>
        <div className="rb-sparkle-el" style={{ top: '30%', left: '22%', fontSize: 14, animationDelay: '0s' }}>✦</div>
        <div className="rb-sparkle-el" style={{ top: '65%', right: '24%', fontSize: 18, animationDelay: '.8s' }}>✦</div>
        <div className="rb-sparkle-el" style={{ top: '40%', right: '10%', fontSize: 11, animationDelay: '1.4s' }}>✦</div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <RevealOnScroll>
            <p className="eyebrow" style={{ color: '#FFE8B0' }}>Raksha Bandhan · 2026</p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <h1 className="rb-hero-title serif text-4xl sm:text-5xl md:text-6xl mt-4 mb-5 leading-[1.1]">
              Create Your Perfect <em>Raksha Bandhan</em> Combo
            </h1>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="text-sm sm:text-base opacity-85 max-w-lg mx-auto mb-9 font-handwriting" style={{ fontSize: '1.35rem' }}>
              Pick your favourite gifts, create a special combo, and make this Raksha Bandhan unforgettable.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.3}>
            <a href="#combo-grid" className="btn-luxury btn-gold-solid">
              <span>Create Your Combo</span>
            </a>
          </RevealOnScroll>
        </div>

        <svg className="rb-wave absolute -bottom-1 left-0" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: 48 }}>
          <path d="M0,32 C240,60 480,0 720,20 C960,40 1200,60 1440,24 L1440,60 L0,60 Z" fill="var(--ivory)" />
        </svg>
      </section>

      {/* ─────────────────────── Product selection ─────────────────────── */}
      <section id="combo-grid" className={`px-4 sm:px-6 md:px-16 max-w-6xl mx-auto pt-16 ${selections.length > 0 ? 'pb-44' : 'pb-20'}`}>
        <RevealOnScroll>
          <Eyebrow>Build Your Own</Eyebrow>
          <h2 className="serif text-3xl md:text-4xl mt-2 mb-3">Select Your Gifts</h2>
          <p className="text-sm opacity-70 mb-10 max-w-xl">
            Select at least {minProducts} pieces below and get them together for{' '}
            <strong style={{ color: 'var(--gold-deep)' }}>{formatPrice(settings.price)}</strong> — regardless of their individual prices.
          </p>
        </RevealOnScroll>

        {products.length === 0 ? (
          <p className="text-sm opacity-60">No products are currently available for combo selection.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p, i) => {
              const selected = selections.some((s) => s.productId === p.id);
              const primary = p.images.find((im) => im.isPrimary) ?? p.images[0];
              return (
                <RevealOnScroll key={p.id} delay={(i % 4) * 0.06}>
                  <div
                    className={`rb-card border rounded-sm p-3 bg-white ${selected ? 'rb-card-selected' : ''} ${justSelected === p.id ? 'rb-card-pulse' : ''}`}
                    style={{ borderColor: selected ? 'var(--gold-deep)' : 'rgba(43,38,32,.12)' }}
                  >
                    {selected && <div className="rb-card-badge">✓</div>}
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
                          ? { background: 'linear-gradient(120deg, var(--rb-maroon), var(--gold-deep))', color: '#fff' }
                          : { border: '1px solid rgba(43,38,32,.3)' }
                      }
                    >
                      {selected ? '✓ Added to Combo' : 'Select / Add to Combo'}
                    </button>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────── Floating combo box ─────────────────────── */}
      {selections.length > 0 && (
        <div className="rb-combo-box fixed bottom-0 left-0 right-0 z-[95]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-2.5 gap-3">
              <p className="text-xs sm:text-sm font-medium tracking-wide" style={{ color: '#FFE8B0' }}>
                🪢 Your Raksha Bandhan Combo
              </p>
              {isValid ? (
                <span className="rb-ready-pop text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(255,232,176,.18)', color: '#FFE8B0' }}>
                  🎉 Combo Unlocked!
                </span>
              ) : (
                <span className="text-[11px] sm:text-xs opacity-75">{selections.length} / {minProducts} selected</span>
              )}
            </div>

            <div className="rb-progress-track mb-3">
              <div className="rb-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            {dotCount > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                {Array.from({ length: dotCount }).map((_, i) => (
                  <span key={i} className={`rb-dot ${i < selections.length ? 'rb-dot-filled' : ''}`} />
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 flex items-center gap-3 overflow-x-auto w-full">
                {selections.map((s) => (
                  <div key={s.productId} className="rb-thumb relative shrink-0 w-14 h-14 rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--gold)' }}>
                    {s.imageUrl && <Image src={getUploadUrl(s.imageUrl)} alt={s.productName} fill className="object-cover" sizes="56px" />}
                    <button
                      onClick={() => removeSelection(s.productId)}
                      aria-label={`Remove ${s.productName} from combo`}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="text-center sm:text-right shrink-0 min-w-[180px]">
                {isValid ? (
                  <p className="text-sm sm:text-base font-medium">
                    {selections.length} products selected · <span style={{ color: '#FFE8B0' }}>{formatPrice(settings.price)}</span>
                  </p>
                ) : (
                  <p className="text-xs opacity-80">
                    Add {remaining} more product{remaining === 1 ? '' : 's'} to unlock your combo.
                  </p>
                )}
              </div>
              <button
                onClick={handleAddCombo}
                disabled={!isValid || adding}
                className={`btn-luxury btn-gold-solid shrink-0 w-full sm:w-auto disabled:opacity-40 ${isValid && !adding ? 'rb-ready-btn' : ''}`}
              >
                <span>{adding ? 'Adding…' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO } from '@elaraa/shared';
import { useCart } from '@/lib/cart-context';
import { api, getUploadUrl } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { QtyBox } from '@/components/ui/QtyBox';
import { Footer } from '@/components/layout/Footer';

// Matches the free-shipping threshold already used site-wide (footer copy,
// homepage) rather than the static reference's unrelated hardcoded value.
const FREE_SHIPPING_THRESHOLD = 2000;

interface CouponState {
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  code: string;
  discountAmount: number;
  message: string;
}

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem, addItem } = useCart();
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponState>({ status: 'idle', code: '', discountAmount: 0, message: '' });
  const [upsell, setUpsell] = useState<ProductDTO | null>(null);

  const total = Math.max(0, subtotal - coupon.discountAmount);

  useEffect(() => {
    if (items.length === 0) {
      setUpsell(null);
      return;
    }
    api.get<{ items: ProductDTO[] }>('/api/products?featured=true&limit=6').then((data) => {
      const cartProductIds = new Set(items.map((i) => i.productId));
      const rec = data.items.find((p) => !cartProductIds.has(p.id));
      setUpsell(rec ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCoupon((c) => ({ ...c, status: 'checking' }));
    try {
      const data = await api.post<{ valid: boolean; discountAmount?: number; message: string; code?: string }>(
        '/api/coupons/validate',
        { code: couponInput.trim(), subtotal }
      );
      if (data.valid) {
        setCoupon({ status: 'valid', code: data.code ?? couponInput.trim().toUpperCase(), discountAmount: data.discountAmount ?? 0, message: data.message });
      } else {
        setCoupon({ status: 'invalid', code: '', discountAmount: 0, message: data.message });
      }
    } catch {
      setCoupon({ status: 'invalid', code: '', discountAmount: 0, message: 'Something went wrong, please try again.' });
    }
  }

  async function addUpsell() {
    if (!upsell) return;
    const defaultVariant = upsell.variants.find((v) => v.isDefault) ?? upsell.variants[0];
    if (!defaultVariant) return;
    await addItem(upsell.id, defaultVariant.id, 1);
  }

  return (
    <>
      <div className="pt-28" />
      <section className="px-4 sm:px-6 md:px-16 pb-20 sm:pb-28 max-w-6xl mx-auto">
        <h1 className="serif text-3xl sm:text-4xl md:text-5xl mb-2">Your Bag</h1>
        <p className="text-xs sm:text-sm opacity-60 mb-8 sm:mb-12">
          {cart?.itemCount ?? 0} {cart?.itemCount === 1 ? 'item' : 'items'} in your shopping bag
        </p>

        {isLoading ? (
          <p className="text-center text-sm opacity-60 py-20">Loading your bag…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 space-y-4" style={{ background: 'rgba(255,255,255,.6)', border: '1px solid rgba(43,38,32,.1)' }}>
            <div className="text-4xl opacity-30">🛍️</div>
            <h3 className="serif text-2xl">Your Shopping Bag is Currently Empty</h3>
            <p className="text-xs opacity-60 max-w-md mx-auto">
              Discover our handcrafted premium fashion jewellery collections and add your favorite pieces.
            </p>
            <Button href="/shop" variant="gold-solid">Explore Jewellery</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="md:col-span-2 space-y-6 sm:space-y-8">
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-5 pb-6 border-b p-4"
                    style={{ borderColor: 'rgba(43,38,32,.1)', background: 'rgba(255,255,255,.4)' }}
                  >
                    {item.imageUrl && (
                      <Link href={`/product/${item.productSlug}`} className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden border" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
                        <Image src={getUploadUrl(item.imageUrl)} alt={item.productName} width={96} height={96} className="w-full h-full object-cover" />
                      </Link>
                    )}
                    <div className="flex-1 flex flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link href={`/product/${item.productSlug}`} className="serif text-lg hover:opacity-70">{item.productName}</Link>
                          <p className="text-xs opacity-60 mt-1">{item.variantLabel}</p>
                        </div>
                        <p className="text-sm font-medium">{formatPrice(item.lineTotal)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
                        <QtyBox value={item.quantity} onChange={(q) => updateItem(item.id, q)} max={item.stockQuantity} />
                        <button onClick={() => removeItem(item.id)} className="text-xs opacity-50 hover:opacity-100 underline">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {upsell && (
                <div className="pt-4 border-t" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
                  <p className="eyebrow mb-3">Complete Your Look</p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border p-3.5" style={{ borderColor: 'rgba(43,38,32,.1)', background: 'rgba(255,255,255,.7)' }}>
                    {upsell.images[0] && (
                      <Image src={getUploadUrl(upsell.images[0].url)} alt={upsell.name} width={56} height={56} className="w-14 h-14 object-cover border shrink-0" style={{ borderColor: 'rgba(43,38,32,.1)' }} />
                    )}
                    <div className="flex-1">
                      <h4 className="serif text-base">{upsell.name}</h4>
                      <p className="text-xs font-medium">{formatPrice(upsell.basePrice)}</p>
                    </div>
                    <button onClick={addUpsell} className="btn-luxury btn-gold text-[10px] px-4 py-2 min-h-[36px]">
                      <span>+ Add To Bag</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-fit p-5 sm:p-8" style={{ background: 'var(--cream)' }}>
              <h2 className="serif text-xl sm:text-2xl mb-4 sm:mb-6">Order Summary</h2>

              <div className="mb-6">
                <p className="text-xs opacity-70 mb-2">
                  {remainingForFreeShipping > 0
                    ? `Add ${formatPrice(remainingForFreeShipping)} more to unlock free shipping.`
                    : "You've unlocked free shipping."}
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(43,38,32,.15)' }}>
                  <div className="h-full transition-all duration-500" style={{ width: `${shippingProgress}%`, background: 'var(--gold-deep)' }} />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-70">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Shipping</span>
                  <span className="font-medium" style={{ color: remainingForFreeShipping > 0 ? undefined : '#047857' }}>
                    {remainingForFreeShipping > 0 ? formatPrice(99) : 'Free'}
                  </span>
                </div>
                {coupon.status === 'valid' && (
                  <div className="flex justify-between">
                    <span className="opacity-70">Coupon ({coupon.code})</span>
                    <span className="font-medium" style={{ color: '#047857' }}>−{formatPrice(coupon.discountAmount)}</span>
                  </div>
                )}
              </div>

              <form onSubmit={applyCoupon} className="flex gap-2 mt-6">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo / Voucher Code"
                  className="flex-1 border px-3 py-2 text-xs bg-white outline-none"
                  style={{ borderColor: 'rgba(43,38,32,.2)' }}
                />
                <button type="submit" disabled={coupon.status === 'checking'} className="btn-luxury text-[10px] px-3 py-2 min-h-[38px]">
                  <span>{coupon.status === 'checking' ? '…' : 'Apply'}</span>
                </button>
              </form>
              {coupon.message && (
                <p className="text-[11px] mt-2" style={{ color: coupon.status === 'valid' ? '#047857' : '#b91c1c' }}>
                  {coupon.message}
                </p>
              )}

              <div className="divider-gold my-6" />

              <div className="flex justify-between text-base sm:text-lg mb-6 sm:mb-8">
                <span className="serif font-medium">Grand Total</span>
                <span className="serif font-medium">{formatPrice(total + (remainingForFreeShipping > 0 ? 99 : 0))}</span>
              </div>

              <Button href="/checkout" variant="gold-solid" className="w-full justify-center min-h-[48px]">Proceed to Checkout →</Button>
              <Link href="/shop" className="block text-center text-xs tracking-[.15em] uppercase mt-4 py-2 opacity-60 hover:opacity-100">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}

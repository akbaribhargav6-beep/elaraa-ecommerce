'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AddressDTO, OrderDTO } from '@elaraa/shared';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';

interface CouponState {
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  code: string;
  discountAmount: number;
  message: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: cartLoading, refetch: refetchCart } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(true);

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponState>({ status: 'idle', code: '', discountAmount: 0, message: '' });

  const [form, setForm] = useState({
    customerEmail: user?.email ?? '',
    customerPhone: user?.phone ?? '',
    shipFullName: '',
    shipLine1: '',
    shipLine2: '',
    shipCity: '',
    shipState: '',
    shipPostalCode: '',
    shipCountry: 'India',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [giftPackagingFee, setGiftPackagingFee] = useState(0);
  const [giftPackaging, setGiftPackaging] = useState(false);

  useEffect(() => {
    // Admin-configurable — always fetched fresh rather than hardcoded, so a
    // price change in Settings shows up immediately without a redeploy.
    api.get<{ giftPackagingFee: number }>('/api/settings').then((data) => setGiftPackagingFee(data.giftPackagingFee));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get<{ addresses: AddressDTO[] }>('/api/addresses').then((data) => {
      setAddresses(data.addresses);
      const def = data.addresses.find((a) => a.isDefault) ?? data.addresses[0];
      if (def) {
        setSelectedAddressId(def.id);
        setUseNewAddress(false);
      }
    });
  }, [user]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, customerEmail: user.email, customerPhone: user.phone ?? f.customerPhone }));
  }, [user]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim() || !cart) return;
    setCoupon((c) => ({ ...c, status: 'checking' }));
    try {
      const data = await api.post<{ valid: boolean; discountAmount?: number; message: string; code?: string }>(
        '/api/coupons/validate',
        { code: couponInput.trim(), subtotal: cart.subtotal }
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

  function removeCoupon() {
    setCouponInput('');
    setCoupon({ status: 'idle', code: '', discountAmount: 0, message: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const couponCode = coupon.status === 'valid' ? coupon.code : undefined;
      const body =
        !useNewAddress && selectedAddressId
          ? {
              customerEmail: form.customerEmail,
              customerPhone: form.customerPhone,
              shippingAddressId: selectedAddressId,
              shipCountry: form.shipCountry,
              paymentMethod: 'COD' as const,
              notes: form.notes,
              couponCode,
              giftPackaging,
            }
          : { ...form, paymentMethod: 'COD' as const, couponCode, giftPackaging };

      const data = await api.post<{ order: OrderDTO }>('/api/orders', body);
      await refetchCart();
      router.push(`/checkout/confirmation/${data.order.orderNumber}?email=${encodeURIComponent(data.order.customerEmail)}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong placing your order.');
    } finally {
      setSubmitting(false);
    }
  }

  if (cartLoading) return <div className="pt-40 text-center text-sm opacity-60">Loading…</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <div className="pt-28" />
        <div className="text-center py-20 px-6">
          <p className="text-sm opacity-60 mb-8">Your bag is empty. Add something before checking out.</p>
          <Button href="/shop">Continue Shopping</Button>
        </div>
      </>
    );
  }

  // Shipping and GST aren't estimated here (they depend on server-side
  // rules resolved at order placement — see the note below), so this is
  // subtotal → discount → gift charge, not the final invoiced amount.
  const discountAmount = coupon.status === 'valid' ? coupon.discountAmount : 0;
  const giftCharge = giftPackaging ? giftPackagingFee : 0;
  const estimatedTotal = Math.max(0, cart.subtotal - discountAmount + giftCharge);

  return (
    <>
      <div className="pt-28" />
      <section className="px-4 sm:px-6 md:px-16 pb-20 sm:pb-28 max-w-6xl mx-auto">
        <h1 className="serif text-3xl sm:text-4xl md:text-5xl mb-8 sm:mb-12">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <form onSubmit={handleSubmit} className="md:col-span-2 space-y-8 sm:space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="step-num">1</span>
                <h2 className="serif text-xl">Contact</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input required type="email" placeholder="Email" value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                <input required placeholder="Phone" value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="step-num">2</span>
                <h2 className="serif text-xl">Shipping Address</h2>
              </div>

              {user && addresses.length > 0 && (
                <div className="space-y-2 mb-4">
                  {addresses.map((a) => (
                    <label key={a.id} className="flex items-start gap-2 text-sm cursor-pointer border p-3" style={{ borderColor: selectedAddressId === a.id && !useNewAddress ? 'var(--gold-deep)' : 'rgba(43,38,32,.15)' }}>
                      <input type="radio" checked={!useNewAddress && selectedAddressId === a.id} onChange={() => { setSelectedAddressId(a.id); setUseNewAddress(false); }} className="mt-1" />
                      <span>{a.fullName}, {a.line1}, {a.city}, {a.state} {a.postalCode}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={useNewAddress} onChange={() => setUseNewAddress(true)} />
                    Use a new address
                  </label>
                </div>
              )}

              {useNewAddress && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <input required placeholder="Full name" value={form.shipFullName} onChange={(e) => update('shipFullName', e.target.value)} className="border p-3 text-sm bg-transparent outline-none sm:col-span-2" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                  <input required placeholder="Address line 1" value={form.shipLine1} onChange={(e) => update('shipLine1', e.target.value)} className="border p-3 text-sm bg-transparent outline-none sm:col-span-2" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                  <input placeholder="Address line 2 (optional)" value={form.shipLine2} onChange={(e) => update('shipLine2', e.target.value)} className="border p-3 text-sm bg-transparent outline-none sm:col-span-2" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                  <input required placeholder="City" value={form.shipCity} onChange={(e) => update('shipCity', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                  <input required placeholder="State" value={form.shipState} onChange={(e) => update('shipState', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                  <input required placeholder="PIN code" value={form.shipPostalCode} onChange={(e) => update('shipPostalCode', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                  <input disabled value="India" className="border p-3 text-sm bg-transparent outline-none opacity-60" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="step-num">3</span>
                <h2 className="serif text-xl">Payment</h2>
              </div>
              <label className="flex items-center gap-3 border px-4 py-3 text-sm cursor-pointer" style={{ borderColor: 'var(--gold-deep)' }}>
                <input type="radio" name="pay" checked readOnly /> Cash on Delivery
              </label>
              <p className="text-xs opacity-50 mt-2">Online payment is coming soon. For now, pay when your order arrives.</p>
            </div>

            <textarea
              placeholder="Order notes (optional)"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              className="w-full border p-3 text-sm bg-transparent outline-none"
              style={{ borderColor: 'rgba(43,38,32,.2)' }}
            />

            {error && <p className="text-sm text-red-700">{error}</p>}

            <Button variant="gold-solid" className="w-full justify-center" disabled={submitting}>
              {submitting ? 'Placing Order…' : 'Place Order'}
            </Button>
          </form>

          <div className="h-fit p-8" style={{ background: 'var(--cream)' }}>
            <h2 className="serif text-xl mb-6">Order Summary</h2>
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm mb-3">
                <span className="opacity-70">{item.productName} × {item.quantity}</span>
                <span>{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
            <div className="divider-gold my-4" />
            <div className="flex justify-between text-base">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {coupon.status === 'valid' && (
              <div className="flex justify-between text-sm mt-2">
                <span className="opacity-70">Coupon ({coupon.code})</span>
                <span className="font-medium" style={{ color: '#047857' }}>−{formatPrice(coupon.discountAmount)}</span>
              </div>
            )}

            <label className="flex items-start gap-2.5 mt-4 pt-4 border-t text-sm cursor-pointer" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
              <input
                type="checkbox"
                checked={giftPackaging}
                onChange={(e) => setGiftPackaging(e.target.checked)}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span>🎁 Add Gift Packaging</span>
                  <span className="opacity-70">{giftPackagingFee > 0 ? `+${formatPrice(giftPackagingFee)}` : 'Free'}</span>
                </span>
                <span className="block text-xs opacity-50 mt-0.5">Wrapped in our signature gift packaging, ready to hand over.</span>
              </span>
            </label>

            <div className="divider-gold my-4" />
            <div className="flex justify-between text-base sm:text-lg">
              <span className="serif font-medium">Total Amount</span>
              <span className="serif font-medium">{formatPrice(estimatedTotal)}</span>
            </div>

            {coupon.status === 'valid' ? (
              <div className="flex items-center justify-between mt-4 text-xs border px-3 py-2" style={{ borderColor: 'rgba(4,120,87,.3)', background: 'rgba(4,120,87,.06)' }}>
                <span style={{ color: '#047857' }}>✓ {coupon.message}</span>
                <button type="button" onClick={removeCoupon} className="underline opacity-70 hover:opacity-100">Remove</button>
              </div>
            ) : (
              <form onSubmit={applyCoupon} className="flex gap-2 mt-4">
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
            )}
            {coupon.status === 'invalid' && coupon.message && (
              <p className="text-[11px] mt-2" style={{ color: '#b91c1c' }}>{coupon.message}</p>
            )}

            <p className="text-xs opacity-50 mt-4">Shipping and GST are calculated at order placement and added to the total above.</p>
          </div>
        </div>
      </section>
    </>
  );
}

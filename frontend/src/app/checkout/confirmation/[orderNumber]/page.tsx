'use client';

import { Suspense, useEffect, useState } from 'react';
import type { OrderDTO } from '@elaraa/shared';
import { useParams, useSearchParams } from 'next/navigation';
import { api, ApiClientError, getAccessToken } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout/Footer';

function OrderConfirmationContent() {
  const params = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    api
      .get<{ order: OrderDTO }>(`/api/orders/${params.orderNumber}${query}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Order not found'));
  }, [params.orderNumber, email]);

  async function downloadInvoice() {
    if (!order) return;
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.orderNumber}/invoice${query}`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${order.orderNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {error && <p className="text-sm opacity-70">{error}</p>}
      {!error && !order && <p className="text-sm opacity-60">Loading your order…</p>}
      {order && (
        <>
          <Eyebrow>Order Confirmed</Eyebrow>
          <h1 className="serif text-4xl md:text-5xl mt-4 mb-6">Thank You, {order.shipFullName.split(' ')[0]}</h1>
          <p className="text-sm opacity-70 mb-10">
            Your order <strong>{order.orderNumber}</strong> has been placed and will be paid on delivery. A
            confirmation email is on its way to {order.customerEmail}.
          </p>

          <div className="text-left p-8" style={{ background: 'var(--cream)' }}>
            {order.comboGroups.map((group) => {
              const groupItems = order.items.filter((i) => i.comboGroupId === group.groupId);
              return (
                <div key={group.groupId} className="mb-4 p-3" style={{ border: '1px solid var(--gold-deep)', background: 'rgba(255,255,255,.5)' }}>
                  <p className="text-sm font-medium mb-2">🎁 {group.name}</p>
                  {groupItems.map((item, i) => (
                    <div key={item.id} className="flex justify-between text-xs mb-1.5">
                      <span className="opacity-70">{i + 1}. {item.productName} ({item.variantLabel})</span>
                      <span>{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                  <div className="divider-gold my-2" />
                  <div className="flex justify-between text-[11px] mb-1"><span className="opacity-60">Products Total</span><span>{formatPrice(group.originalTotal)}</span></div>
                  <div className="flex justify-between text-[11px] mb-1"><span className="opacity-60">Combo Discount</span><span style={{ color: '#047857' }}>−{formatPrice(group.discount)}</span></div>
                  <div className="flex justify-between text-xs font-medium"><span>Combo Price</span><span>{formatPrice(group.comboPrice)}</span></div>
                </div>
              );
            })}
            {order.items.filter((item) => !item.comboGroupId).map((item) => (
              <div key={item.id} className="mb-3">
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">{item.productName} ({item.variantLabel}) × {item.quantity}</span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </div>
              </div>
            ))}
            <div className="divider-gold my-4" />
            <div className="flex justify-between text-sm mb-2"><span className="opacity-70">Products Total</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.comboDiscount > 0 && (
              <div className="flex justify-between text-sm mb-2"><span className="opacity-70">🎁 Combo Discount</span><span style={{ color: '#047857' }}>−{formatPrice(order.comboDiscount)}</span></div>
            )}
            <div className="flex justify-between text-sm mb-2"><span className="opacity-70">Shipping</span><span>{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="opacity-70">GST</span><span>{formatPrice(order.taxAmount)}</span></div>
            {order.giftPackaging && (
              <div className="flex justify-between text-sm mb-4"><span className="opacity-70">🎁 Gift Packaging</span><span>{formatPrice(order.giftPackagingFee)}</span></div>
            )}
            <div className="flex justify-between text-base font-medium"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></div>
            <div className="divider-gold my-4" />
            <p className="text-xs opacity-70">
              {order.shipFullName}
              <br />
              {order.shipLine1}{order.shipLine2 ? `, ${order.shipLine2}` : ''}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPostalCode}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            <Button href="/shop">Continue Shopping</Button>
            <Button href="/account/orders" variant="gold">View Orders</Button>
            <Button onClick={downloadInvoice} variant="gold">Download Invoice</Button>
          </div>
        </>
      )}
    </>
  );
}

export default function OrderConfirmationPage() {
  return (
    <>
      <div className="pt-28" />
      <section className="px-6 pb-28 max-w-2xl mx-auto text-center">
        <Suspense fallback={<p className="text-sm opacity-60">Loading your order…</p>}>
          <OrderConfirmationContent />
        </Suspense>
      </section>
      <Footer />
    </>
  );
}

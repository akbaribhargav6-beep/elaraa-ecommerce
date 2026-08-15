'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { OrderDTO } from '@elaraa/shared';
import { api, ApiClientError, getAccessToken } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/Button';

const CANCELLABLE = new Set(['PENDING', 'CONFIRMED']);

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    api
      .get<{ order: OrderDTO }>(`/api/orders/${params.orderNumber}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : 'Order not found'));
  }

  useEffect(load, [params.orderNumber]);

  async function downloadInvoice() {
    if (!order) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${order.orderNumber}/invoice`, {
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

  async function handleCancel() {
    setCancelling(true);
    try {
      await api.post(`/api/orders/${params.orderNumber}/cancel`);
      load();
    } finally {
      setCancelling(false);
    }
  }

  if (error) return <p className="text-sm opacity-70">{error}</p>;
  if (!order) return <p className="text-sm opacity-60">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">{order.orderNumber}</h1>
        <span className="text-xs uppercase tracking-wide px-3 py-1" style={{ background: 'var(--cream)' }}>{order.status}</span>
      </div>

      <div className="p-6 mb-8" style={{ background: 'var(--cream)' }}>
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
      </div>

      <div className="text-sm opacity-70 mb-8">
        <p className="text-xs uppercase tracking-wide opacity-50 mb-2">Shipping to</p>
        <p>{order.shipFullName}</p>
        <p>{order.shipLine1}{order.shipLine2 ? `, ${order.shipLine2}` : ''}</p>
        <p>{order.shipCity}, {order.shipState} {order.shipPostalCode}</p>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="gold" onClick={downloadInvoice}>Download Invoice</Button>
        {CANCELLABLE.has(order.status) && (
          <Button onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </Button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { OrderDTO, OrderStatus } from '@elaraa/shared';
import { api, ApiClientError } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

const STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
  'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
];

interface HistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PENDING');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  function load() {
    api.get<{ order: OrderDTO }>(`/api/admin/orders/${params.orderNumber}`).then((d) => {
      setOrder(d.order);
      setNewStatus(d.order.status);
    });
    api.get<{ history: HistoryEntry[] }>(`/api/admin/orders/${params.orderNumber}/history`).then((d) => setHistory(d.history));
  }
  useEffect(load, [params.orderNumber]);

  async function updateStatus(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUpdating(true);
    try {
      await api.patch(`/api/admin/orders/${params.orderNumber}/status`, { status: newStatus, note: note || undefined });
      setNote('');
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setUpdating(false);
    }
  }

  if (!order) return <p className="text-sm opacity-60">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="serif text-3xl">{order.orderNumber}</h1>
        <p className="text-sm opacity-60 mt-1">Placed {new Date(order.placedAt).toLocaleString()}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Items</h2>

          {order.comboGroups.map((group) => {
            const groupItems = order.items.filter((i) => i.comboGroupId === group.groupId);
            return (
              <div key={group.groupId} className="mb-4 p-3" style={{ border: '1px solid var(--gold-deep)', background: 'rgba(201,166,107,.06)' }}>
                <p className="text-sm font-medium mb-2">🎁 {group.name} — Combo Order</p>
                <ul className="text-xs space-y-1 mb-2">
                  {groupItems.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span className="opacity-70">{i.productName} ({i.variantLabel})</span>
                      <span>{formatPrice(i.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="divider-gold my-2" />
                <div className="flex justify-between text-[11px] mb-1"><span className="opacity-60">Original Total</span><span>{formatPrice(group.originalTotal)}</span></div>
                <div className="flex justify-between text-[11px] mb-1"><span className="opacity-60">Combo Discount</span><span style={{ color: '#047857' }}>−{formatPrice(group.discount)}</span></div>
                <div className="flex justify-between text-xs font-medium"><span>Combo Price</span><span>{formatPrice(group.comboPrice)}</span></div>
              </div>
            );
          })}

          {order.items.filter((i) => !i.comboGroupId).map((i) => (
            <div key={i.id} className="mb-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">{i.productName} ({i.variantLabel}) × {i.quantity}</span>
                <span>{formatPrice(i.lineTotal)}</span>
              </div>
            </div>
          ))}

          <div className="divider-gold my-3" />
          <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.comboDiscount > 0 && (
            <div className="flex justify-between text-sm mb-1"><span className="opacity-60">🎁 Combo Discount</span><span style={{ color: '#047857' }}>−{formatPrice(order.comboDiscount)}</span></div>
          )}
          <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Shipping</span><span>{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span></div>
          <div className="flex justify-between text-sm mb-1"><span className="opacity-60">GST</span><span>{formatPrice(order.taxAmount)}</span></div>
          <div className="flex justify-between text-sm mb-1">
            <span className="opacity-60">🎁 Gift Packaging</span>
            <span>{order.giftPackaging ? formatPrice(order.giftPackagingFee) : 'Not selected'}</span>
          </div>
          <div className="flex justify-between text-base font-medium mt-2"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
            <h2 className="serif text-xl mb-4">Customer & Shipping</h2>
            <p className="text-sm opacity-70">{order.customerEmail}</p>
            <p className="text-sm opacity-70 mb-3">{order.customerPhone}</p>
            <p className="text-sm">{order.shipFullName}</p>
            <p className="text-sm opacity-70">{order.shipLine1}{order.shipLine2 ? `, ${order.shipLine2}` : ''}</p>
            <p className="text-sm opacity-70">{order.shipCity}, {order.shipState} {order.shipPostalCode}</p>
          </div>

          <form onSubmit={updateStatus} className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
            <h2 className="serif text-xl mb-4">Update Status</h2>
            <p className="text-xs opacity-60 mb-3">
              Current: <strong>{order.status.replace(/_/g, ' ')}</strong> · Payment: {order.paymentMethod} / {order.paymentStatus}
            </p>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)} className="w-full border p-2 text-sm bg-transparent outline-none mb-3" style={{ borderColor: 'rgba(43,38,32,.2)' }}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none mb-3" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
            {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
            <button className="btn-luxury btn-gold-solid text-xs" disabled={updating}><span>{updating ? 'Updating…' : 'Update Status'}</span></button>
          </form>
        </div>
      </div>

      <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <h2 className="serif text-xl mb-4">Status History</h2>
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="text-sm flex items-center justify-between border-b pb-2" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
              <div>
                <span className="uppercase text-xs">{h.status.replace(/_/g, ' ')}</span>
                {h.note && <span className="opacity-60 ml-2">— {h.note}</span>}
              </div>
              <span className="opacity-50 text-xs">{new Date(h.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

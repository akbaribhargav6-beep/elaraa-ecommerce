'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderDTO, OrderStatus } from '@elaraa/shared';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

const STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
  'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
];

export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderDTO[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    api.get<{ items: OrderDTO[] }>(`/api/admin/orders?${params.toString()}`).then((d) => setItems(d.items));
  }, [search, status]);

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Orders</h1>

      <div className="flex items-center gap-4 mb-6">
        <input
          placeholder="Search order #, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 text-sm bg-transparent outline-none flex-1 max-w-xs"
          style={{ borderColor: 'rgba(43,38,32,.2)' }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border p-2 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Order #</th>
              <th className="p-4 font-normal opacity-60">Customer</th>
              <th className="p-4 font-normal opacity-60">Status</th>
              <th className="p-4 font-normal opacity-60">Payment</th>
              <th className="p-4 font-normal opacity-60">Total</th>
              <th className="p-4 font-normal opacity-60">Placed</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.orderNumber} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4"><Link href={`/admin/orders/${o.orderNumber}`} className="underline">{o.orderNumber}</Link></td>
                <td className="p-4 opacity-60">{o.customerEmail}</td>
                <td className="p-4 text-xs uppercase">{o.status.replace(/_/g, ' ')}</td>
                <td className="p-4 text-xs uppercase opacity-60">{o.paymentMethod} · {o.paymentStatus}</td>
                <td className="p-4">{formatPrice(o.totalAmount)}</td>
                <td className="p-4 opacity-60">{new Date(o.placedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-4 opacity-50" colSpan={6}>No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

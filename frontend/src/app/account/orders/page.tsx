'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderDTO } from '@elaraa/shared';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

interface OrderListResponse {
  items: OrderDTO[];
  total: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[] | null>(null);

  useEffect(() => {
    api.get<OrderListResponse>('/api/orders').then((data) => setOrders(data.items));
  }, []);

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Order History</h1>
      {orders === null && <p className="text-sm opacity-60">Loading…</p>}
      {orders?.length === 0 && <p className="text-sm opacity-60">You haven&apos;t placed any orders yet.</p>}
      <div className="space-y-4">
        {orders?.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.orderNumber}`}
            className="block border p-5 hover:opacity-80 transition-opacity"
            style={{ borderColor: 'rgba(43,38,32,.12)' }}
          >
            <div className="flex justify-between text-sm">
              <span className="serif text-lg">{order.orderNumber}</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs opacity-60 mt-2">
              <span>{new Date(order.placedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="uppercase tracking-wide">{order.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

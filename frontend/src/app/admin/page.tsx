'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { StatCard } from '@/components/admin/StatCard';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  pendingReviews: number;
  newContactMessages: number;
  recentOrders: { orderNumber: string; status: string; customerEmail: string; totalAmount: number; placedAt: string }[];
  lowStockVariants: { id: string; sku: string; productName: string; metalLabel: string; stockQuantity: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>('/api/admin/dashboard').then(setStats);
  }, []);

  if (!stats) return <p className="text-sm opacity-60">Loading dashboard…</p>;

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Revenue" value={formatPrice(stats.totalRevenue)} accent />
        <StatCard label="Orders" value={String(stats.totalOrders)} />
        <StatCard label="Customers" value={String(stats.totalCustomers)} />
        <StatCard label="Low Stock Items" value={String(stats.lowStockCount)} />
      </div>

      {(stats.pendingReviews > 0 || stats.newContactMessages > 0) && (
        <div className="flex gap-4 mb-10 text-sm">
          {stats.pendingReviews > 0 && (
            <Link href="/admin/reviews" className="px-4 py-2" style={{ background: 'var(--cream)', border: '1px solid var(--gold-deep)' }}>
              {stats.pendingReviews} review{stats.pendingReviews > 1 ? 's' : ''} pending moderation →
            </Link>
          )}
          {stats.newContactMessages > 0 && (
            <Link href="/admin/contact" className="px-4 py-2" style={{ background: 'var(--cream)', border: '1px solid var(--gold-deep)' }}>
              {stats.newContactMessages} new message{stats.newContactMessages > 1 ? 's' : ''} →
            </Link>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="serif text-xl">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs uppercase tracking-wide opacity-60 hover:opacity-100">View All →</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.orderNumber} className="border-t" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
                  <td className="py-2">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="py-2 opacity-60">{o.customerEmail}</td>
                  <td className="py-2 text-xs uppercase">{o.status}</td>
                  <td className="py-2 text-right">{formatPrice(o.totalAmount)}</td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr><td className="py-4 opacity-50">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="serif text-xl">Low Stock</h2>
            <Link href="/admin/inventory" className="text-xs uppercase tracking-wide opacity-60 hover:opacity-100">View All →</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {stats.lowStockVariants.map((v) => (
                <tr key={v.id} className="border-t" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
                  <td className="py-2">{v.productName}</td>
                  <td className="py-2 opacity-60">{v.metalLabel}</td>
                  <td className="py-2 text-right" style={{ color: v.stockQuantity === 0 ? '#b91c1c' : 'var(--gold-deep)' }}>
                    {v.stockQuantity} left
                  </td>
                </tr>
              ))}
              {stats.lowStockVariants.length === 0 && (
                <tr><td className="py-4 opacity-50">All stock levels healthy.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

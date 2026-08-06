'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  orderCount: number;
  totalSpent: number;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.set('search', search);
    api.get<{ items: Customer[] }>(`/api/admin/customers?${params.toString()}`).then((d) => setItems(d.items));
  }, [search]);

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Customers</h1>

      <input
        placeholder="Search name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 text-sm bg-transparent outline-none mb-6 max-w-xs"
        style={{ borderColor: 'rgba(43,38,32,.2)' }}
      />

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Name</th>
              <th className="p-4 font-normal opacity-60">Email</th>
              <th className="p-4 font-normal opacity-60">Orders</th>
              <th className="p-4 font-normal opacity-60">Total Spent</th>
              <th className="p-4 font-normal opacity-60">Joined</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4"><Link href={`/admin/customers/${c.id}`} className="underline">{c.firstName} {c.lastName}</Link></td>
                <td className="p-4 opacity-60">{c.email}</td>
                <td className="p-4">{c.orderCount}</td>
                <td className="p-4">{formatPrice(c.totalSpent)}</td>
                <td className="p-4 opacity-60">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-4 opacity-50" colSpan={5}>No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

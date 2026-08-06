'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProductDTO } from '@elaraa/shared';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductDTO[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');

  function load() {
    const params = new URLSearchParams({ status, limit: '50' });
    if (search) params.set('search', search);
    api.get<{ items: ProductDTO[] }>(`/api/admin/products?${params.toString()}`).then((d) => setItems(d.items));
  }

  useEffect(load, [search, status]);

  async function handleDelete(p: ProductDTO) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const result = await api.delete<{ hardDeleted: boolean; reason?: string }>(`/api/admin/products/${p.id}`);
    if (!result.hardDeleted) alert(result.reason);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">Products</h1>
        <Link href="/admin/products/new" className="btn-luxury btn-gold-solid text-xs"><span>New Product</span></Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 text-sm bg-transparent outline-none flex-1 max-w-xs"
          style={{ borderColor: 'rgba(43,38,32,.2)' }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="border p-2 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Name</th>
              <th className="p-4 font-normal opacity-60">Price</th>
              <th className="p-4 font-normal opacity-60">Variants</th>
              <th className="p-4 font-normal opacity-60">Rating</th>
              <th className="p-4 font-normal opacity-60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4">{p.name}</td>
                <td className="p-4">{formatPrice(p.basePrice)}</td>
                <td className="p-4 opacity-60">{p.variants.length}</td>
                <td className="p-4 opacity-60">{p.reviewCount > 0 ? `${p.avgRating}★ (${p.reviewCount})` : '—'}</td>
                <td className="p-4 space-x-3">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-xs underline">Edit</Link>
                  <button onClick={() => handleDelete(p)} className="text-xs underline opacity-60">Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="p-4 opacity-50" colSpan={5}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

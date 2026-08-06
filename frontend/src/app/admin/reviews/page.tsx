'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface AdminReview {
  id: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string | null;
  body: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState('');

  function load() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    api.get<{ items: AdminReview[] }>(`/api/admin/reviews?${params.toString()}`).then((d) => setItems(d.items));
  }
  useEffect(load, [status]);

  async function setReviewStatus(id: string, next: 'APPROVED' | 'REJECTED') {
    await api.patch(`/api/admin/reviews/${id}/status`, { status: next });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this review permanently?')) return;
    await api.delete(`/api/admin/reviews/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Reviews</h1>

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="border p-2 text-sm bg-transparent outline-none mb-6" style={{ borderColor: 'rgba(43,38,32,.2)' }}>
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>

      <div className="space-y-4">
        {items.map((r) => (
          <div key={r.id} className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <span className="text-sm ml-3">{r.productName}</span>
                {r.isVerifiedPurchase && <span className="text-[10px] uppercase opacity-50 ml-2">Verified Purchase</span>}
              </div>
              <span className="text-xs uppercase" style={{ color: r.status === 'APPROVED' ? 'var(--gold-deep)' : r.status === 'REJECTED' ? '#b91c1c' : '#999' }}>
                {r.status}
              </span>
            </div>
            {r.title && <p className="serif text-lg">{r.title}</p>}
            <p className="text-sm opacity-70 mt-1">{r.body}</p>
            <p className="text-xs opacity-50 mt-2">{r.customerName} ({r.customerEmail}) · {new Date(r.createdAt).toLocaleDateString()}</p>
            <div className="flex gap-4 mt-3">
              {r.status !== 'APPROVED' && <button onClick={() => setReviewStatus(r.id, 'APPROVED')} className="text-xs underline">Approve</button>}
              {r.status !== 'REJECTED' && <button onClick={() => setReviewStatus(r.id, 'REJECTED')} className="text-xs underline">Reject</button>}
              <button onClick={() => remove(r.id)} className="text-xs underline opacity-60">Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm opacity-50">No reviews found.</p>}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
}

export default function AdminNewsletterPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get<{ items: Subscriber[]; total: number }>('/api/admin/newsletter?limit=100').then((d) => {
      setItems(d.items);
      setTotal(d.total);
    });
  }, []);

  function exportCsv() {
    const rows = ['email,subscribed_at', ...items.map((s) => `${s.email},${s.subscribedAt}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elaraa-newsletter-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">Newsletter Subscribers</h1>
        <button onClick={exportCsv} className="btn-luxury btn-gold text-xs"><span>Export CSV</span></button>
      </div>
      <p className="text-sm opacity-60 mb-6">{total} total subscriber{total === 1 ? '' : 's'}</p>

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Email</th>
              <th className="p-4 font-normal opacity-60">Status</th>
              <th className="p-4 font-normal opacity-60">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4">{s.email}</td>
                <td className="p-4 text-xs uppercase" style={{ color: s.isActive ? 'var(--gold-deep)' : '#999' }}>{s.isActive ? 'Active' : 'Unsubscribed'}</td>
                <td className="p-4 opacity-60">{new Date(s.subscribedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-4 opacity-50" colSpan={3}>No subscribers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

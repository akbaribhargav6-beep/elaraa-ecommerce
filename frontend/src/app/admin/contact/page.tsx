'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

type MessageStatus = 'NEW' | 'READ' | 'RESPONDED' | 'ARCHIVED';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: MessageStatus;
  createdAt: string;
}

export default function AdminContactPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [status, setStatus] = useState('');

  function load() {
    const params = new URLSearchParams({ limit: '50' });
    if (status) params.set('status', status);
    api.get<{ items: ContactMessage[] }>(`/api/admin/contact?${params.toString()}`).then((d) => setItems(d.items));
  }
  useEffect(load, [status]);

  async function setStatusFor(id: string, next: MessageStatus) {
    await api.patch(`/api/admin/contact/${id}/status`, { status: next });
    load();
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Messages</h1>

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="border p-2 text-sm bg-transparent outline-none mb-6" style={{ borderColor: 'rgba(43,38,32,.2)' }}>
        <option value="">All statuses</option>
        <option value="NEW">New</option>
        <option value="READ">Read</option>
        <option value="RESPONDED">Responded</option>
        <option value="ARCHIVED">Archived</option>
      </select>

      <div className="space-y-4">
        {items.map((m) => (
          <div key={m.id} className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium">{m.name}</span>
                <span className="text-xs opacity-60 ml-2">{m.email}{m.phone ? ` · ${m.phone}` : ''}</span>
              </div>
              <span className="text-xs uppercase" style={{ color: m.status === 'NEW' ? 'var(--gold-deep)' : '#999' }}>{m.status}</span>
            </div>
            {m.subject && <p className="text-sm font-medium mb-1">{m.subject}</p>}
            <p className="text-sm opacity-70">{m.message}</p>
            <p className="text-xs opacity-50 mt-2">{new Date(m.createdAt).toLocaleString()}</p>
            <div className="flex gap-4 mt-3">
              {m.status !== 'READ' && <button onClick={() => setStatusFor(m.id, 'READ')} className="text-xs underline">Mark Read</button>}
              {m.status !== 'RESPONDED' && <button onClick={() => setStatusFor(m.id, 'RESPONDED')} className="text-xs underline">Mark Responded</button>}
              {m.status !== 'ARCHIVED' && <button onClick={() => setStatusFor(m.id, 'ARCHIVED')} className="text-xs underline opacity-60">Archive</button>}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm opacity-50">No messages found.</p>}
      </div>
    </div>
  );
}

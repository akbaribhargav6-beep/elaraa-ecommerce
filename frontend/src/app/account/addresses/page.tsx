'use client';

import { useEffect, useState } from 'react';
import type { AddressDTO } from '@elaraa/shared';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';

const EMPTY = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressDTO[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<{ addresses: AddressDTO[] }>('/api/addresses').then((data) => setAddresses(data.addresses));
  }

  useEffect(load, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/addresses', form);
      setForm(EMPTY);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/addresses/${id}`);
    load();
  }

  async function handleSetDefault(id: string) {
    await api.patch(`/api/addresses/${id}/default`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">Address Book</h1>
        <button onClick={() => setShowForm((s) => !s)} className="text-xs tracking-[.15em] uppercase hover:opacity-60">
          {showForm ? 'Cancel' : '+ Add Address'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 mb-10 p-6" style={{ background: 'var(--cream)' }}>
          <input required placeholder="Full name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="border p-3 text-sm bg-transparent outline-none sm:col-span-2" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input required placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="border p-3 text-sm bg-transparent outline-none sm:col-span-2" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input required placeholder="Address line 1" value={form.line1} onChange={(e) => update('line1', e.target.value)} className="border p-3 text-sm bg-transparent outline-none sm:col-span-2" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input placeholder="Address line 2" value={form.line2} onChange={(e) => update('line2', e.target.value)} className="border p-3 text-sm bg-transparent outline-none sm:col-span-2" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input required placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input required placeholder="State" value={form.state} onChange={(e) => update('state', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <input required placeholder="PIN code" value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} className="border p-3 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }} />
          <div className="sm:col-span-2">
            <Button variant="gold-solid" disabled={saving}>{saving ? 'Saving…' : 'Save Address'}</Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {addresses?.map((a) => (
          <div key={a.id} className="border p-5 flex items-start justify-between" style={{ borderColor: 'rgba(43,38,32,.12)' }}>
            <div className="text-sm">
              <p>{a.fullName} {a.isDefault && <span className="text-[10px] uppercase tracking-wide ml-2" style={{ color: 'var(--gold-deep)' }}>Default</span>}</p>
              <p className="opacity-60 mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}</p>
              <p className="opacity-60">{a.phone}</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs">
              {!a.isDefault && <button onClick={() => handleSetDefault(a.id)} className="opacity-60 hover:opacity-100">Set Default</button>}
              <button onClick={() => handleDelete(a.id)} className="opacity-60 hover:opacity-100">Delete</button>
            </div>
          </div>
        ))}
        {addresses?.length === 0 && <p className="text-sm opacity-60">No saved addresses yet.</p>}
      </div>
    </div>
  );
}

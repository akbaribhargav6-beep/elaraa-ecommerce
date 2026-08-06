'use client';

import { useEffect, useState } from 'react';
import { api, ApiClientError } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderValue: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

const inputStyle = { borderColor: 'rgba(43,38,32,.2)' };
const emptyForm = { code: '', discountType: 'PERCENTAGE' as const, discountValue: '', minOrderValue: '', usageLimit: '' };

export default function AdminCouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<{ coupons: Coupon[] }>('/api/admin/coupons').then((d) => setItems(d.coupons));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/admin/coupons', {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    }
  }

  async function toggleActive(c: Coupon) {
    await api.patch(`/api/admin/coupons/${c.id}`, { isActive: !c.isActive });
    load();
  }

  async function remove(c: Coupon) {
    const result = await api.delete<{ hardDeleted: boolean; reason?: string }>(`/api/admin/coupons/${c.id}`);
    if (!result.hardDeleted) alert(result.reason);
    load();
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Coupons</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 mb-8 grid sm:grid-cols-5 gap-4 items-end" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <div>
          <label className="text-xs opacity-60 block mb-1">Code</label>
          <input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Type</label>
          <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as typeof f.discountType }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed Amount</option>
          </select>
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Value</label>
          <input required type="number" min="0" step="0.01" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Min Order (₹)</label>
          <input type="number" min="0" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <button className="btn-luxury btn-gold-solid text-xs"><span>Add Coupon</span></button>
      </form>
      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Code</th>
              <th className="p-4 font-normal opacity-60">Discount</th>
              <th className="p-4 font-normal opacity-60">Min Order</th>
              <th className="p-4 font-normal opacity-60">Used</th>
              <th className="p-4 font-normal opacity-60">Status</th>
              <th className="p-4 font-normal opacity-60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4 font-mono">{c.code}</td>
                <td className="p-4">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : formatPrice(c.discountValue)}</td>
                <td className="p-4 opacity-60">{c.minOrderValue ? formatPrice(c.minOrderValue) : '—'}</td>
                <td className="p-4">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td className="p-4">
                  <button onClick={() => toggleActive(c)} className="text-xs uppercase" style={{ color: c.isActive ? 'var(--gold-deep)' : '#999' }}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4"><button onClick={() => remove(c)} className="text-xs underline opacity-60">Delete</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-4 opacity-50" colSpan={6}>No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

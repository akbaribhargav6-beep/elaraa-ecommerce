'use client';

import { useEffect, useState } from 'react';
import type { CategoryDTO } from '@elaraa/shared';
import { api, ApiClientError } from '@/lib/api-client';

interface Discount {
  id: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  scope: 'ALL' | 'CATEGORY' | 'PRODUCT';
  categoryName: string | null;
  productName: string | null;
  isActive: boolean;
}

interface DiscountForm {
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: string;
  scope: 'ALL' | 'CATEGORY' | 'PRODUCT';
  categoryId: string;
}

const inputStyle = { borderColor: 'rgba(43,38,32,.2)' };
const emptyForm: DiscountForm = { name: '', discountType: 'PERCENTAGE', discountValue: '', scope: 'ALL', categoryId: '' };

export default function AdminDiscountsPage() {
  const [items, setItems] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [form, setForm] = useState<DiscountForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<{ discounts: Discount[] }>('/api/admin/discounts').then((d) => setItems(d.discounts));
  }
  useEffect(() => {
    load();
    api.get<{ categories: CategoryDTO[] }>('/api/admin/categories').then((d) => setCategories(d.categories));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/admin/discounts', {
        name: form.name,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        scope: form.scope,
        categoryId: form.scope === 'CATEGORY' ? form.categoryId : undefined,
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    }
  }

  async function toggleActive(d: Discount) {
    await api.patch(`/api/admin/discounts/${d.id}`, { isActive: !d.isActive });
    load();
  }

  async function remove(d: Discount) {
    await api.delete(`/api/admin/discounts/${d.id}`);
    load();
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Discounts</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 mb-8 grid sm:grid-cols-5 gap-4 items-end" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <div>
          <label className="text-xs opacity-60 block mb-1">Name</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
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
          <label className="text-xs opacity-60 block mb-1">Scope</label>
          <select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as typeof f.scope }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle}>
            <option value="ALL">All Products</option>
            <option value="CATEGORY">Category</option>
          </select>
        </div>
        {form.scope === 'CATEGORY' ? (
          <div>
            <label className="text-xs opacity-60 block mb-1">Category</label>
            <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <div />
        )}
        <button className="btn-luxury btn-gold-solid text-xs"><span>Add Discount</span></button>
      </form>
      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Name</th>
              <th className="p-4 font-normal opacity-60">Discount</th>
              <th className="p-4 font-normal opacity-60">Applies To</th>
              <th className="p-4 font-normal opacity-60">Status</th>
              <th className="p-4 font-normal opacity-60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4">{d.name}</td>
                <td className="p-4">{d.discountType === 'PERCENTAGE' ? `${d.discountValue}%` : `₹${d.discountValue}`}</td>
                <td className="p-4 opacity-60">{d.scope === 'ALL' ? 'All Products' : d.categoryName ?? d.productName}</td>
                <td className="p-4">
                  <button onClick={() => toggleActive(d)} className="text-xs uppercase" style={{ color: d.isActive ? 'var(--gold-deep)' : '#999' }}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4"><button onClick={() => remove(d)} className="text-xs underline opacity-60">Delete</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-4 opacity-50" colSpan={5}>No discounts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

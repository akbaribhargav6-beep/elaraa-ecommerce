'use client';

import { useEffect, useState } from 'react';
import type { ProductDTO } from '@elaraa/shared';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

interface Setting {
  key: string;
  value: string;
}

interface ComboForm {
  enabled: boolean;
  name: string;
  minProducts: string;
  price: string;
}

const DEFAULT_FORM: ComboForm = { enabled: false, name: 'Raksha Bandhan Combo', minProducts: '3', price: '' };

export default function AdminComboPage() {
  const [form, setForm] = useState<ComboForm>(DEFAULT_FORM);
  const [savedForm, setSavedForm] = useState<ComboForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [search, setSearch] = useState('');
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  function loadSettings() {
    api.get<{ settings: Setting[] }>('/api/admin/settings').then((d) => {
      const map = new Map(d.settings.map((s) => [s.key, s.value]));
      const next: ComboForm = {
        enabled: map.get('combo_enabled') === 'true',
        name: map.get('combo_name') || DEFAULT_FORM.name,
        minProducts: map.get('combo_min_products') || DEFAULT_FORM.minProducts,
        price: map.get('combo_price') || '',
      };
      setForm(next);
      setSavedForm(next);
    });
  }

  function loadProducts() {
    const params = new URLSearchParams({ status: 'active', limit: '100' });
    if (search) params.set('search', search);
    api.get<{ items: ProductDTO[] }>(`/api/admin/products?${params.toString()}`).then((d) => setProducts(d.items));
  }

  useEffect(loadSettings, []);
  useEffect(loadProducts, [search]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        api.put('/api/admin/settings/combo_enabled', { value: form.enabled ? 'true' : 'false', group: 'combo' }),
        api.put('/api/admin/settings/combo_name', { value: form.name.trim() || DEFAULT_FORM.name, group: 'combo' }),
        api.put('/api/admin/settings/combo_min_products', { value: form.minProducts || '3', group: 'combo' }),
        api.put('/api/admin/settings/combo_price', { value: form.price || '0', group: 'combo' }),
      ]);
      setSavedForm(form);
    } finally {
      setSaving(false);
    }
  }

  async function toggleEligible(product: ProductDTO, eligible: boolean) {
    setBusyProductId(product.id);
    try {
      await api.patch(`/api/admin/products/${product.id}`, { isComboEligible: eligible });
      setProducts((items) => items.map((p) => (p.id === product.id ? { ...p, isComboEligible: eligible } : p)));
    } finally {
      setBusyProductId(null);
    }
  }

  const inCombo = products.filter((p) => p.isComboEligible);
  const available = products.filter((p) => !p.isComboEligible);
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="serif text-3xl">Combo Management</h1>

      <form onSubmit={saveSettings} className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <h2 className="serif text-xl mb-1">Combo Settings</h2>
        <p className="text-xs opacity-60 mb-5">Controls the storefront &quot;Build Your Own Combo&quot; page.</p>

        <div className="grid sm:grid-cols-2 gap-5">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
            Enable combo feature on the storefront
          </label>

          <div>
            <label className="text-xs opacity-60 block mb-1">Combo Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Raksha Bandhan Combo"
              className="w-full border p-2 text-sm bg-transparent outline-none"
              style={{ borderColor: 'rgba(43,38,32,.2)' }}
            />
          </div>

          <div>
            <label className="text-xs opacity-60 block mb-1">Combo Price (₹)</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="1499"
              className="w-full border p-2 text-sm bg-transparent outline-none"
              style={{ borderColor: 'rgba(43,38,32,.2)' }}
            />
          </div>

          <div>
            <label className="text-xs opacity-60 block mb-1">Minimum Products Required</label>
            <input
              type="number"
              min={2}
              value={form.minProducts}
              onChange={(e) => setForm((f) => ({ ...f, minProducts: e.target.value }))}
              placeholder="3"
              className="w-full border p-2 text-sm bg-transparent outline-none"
              style={{ borderColor: 'rgba(43,38,32,.2)' }}
            />
          </div>
        </div>

        <button type="submit" disabled={saving || !dirty} className="btn-luxury btn-gold-solid text-xs mt-6 disabled:opacity-40">
          <span>{saving ? 'Saving…' : 'Save Settings'}</span>
        </button>
      </form>

      <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <h2 className="serif text-xl mb-1">Combo Products</h2>
        <p className="text-xs opacity-60 mb-5">
          Products added here appear on the storefront combo page. Customers pick any {form.minProducts || 3}+ of them to build a combo.
        </p>

        <input
          placeholder="Search all products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs border p-2 text-sm bg-transparent outline-none mb-6"
          style={{ borderColor: 'rgba(43,38,32,.2)' }}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-50 mb-2">In Combo ({inCombo.length})</p>
            <div className="space-y-2">
              {inCombo.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm border p-2.5" style={{ borderColor: 'var(--gold-deep)' }}>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="opacity-60 text-xs shrink-0">{formatPrice(p.basePrice)}</span>
                  <button
                    onClick={() => toggleEligible(p, false)}
                    disabled={busyProductId === p.id}
                    className="text-xs underline opacity-70 hover:opacity-100 shrink-0 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {inCombo.length === 0 && <p className="text-xs opacity-50">No products added yet.</p>}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide opacity-50 mb-2">Available Products ({available.length})</p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {available.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm border p-2.5" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="opacity-60 text-xs shrink-0">{formatPrice(p.basePrice)}</span>
                  <button
                    onClick={() => toggleEligible(p, true)}
                    disabled={busyProductId === p.id}
                    className="text-xs underline opacity-70 hover:opacity-100 shrink-0 disabled:opacity-30"
                  >
                    Add
                  </button>
                </div>
              ))}
              {available.length === 0 && <p className="text-xs opacity-50">No matching products.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { api, ApiClientError, getUploadUrl, getAccessToken } from '@/lib/api-client';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  placement: 'HOME_HERO' | 'HOME_PROMO' | 'SHOP_TOP';
  sortOrder: number;
  isActive: boolean;
}

const inputStyle = { borderColor: 'rgba(43,38,32,.2)' };
const emptyForm = { title: '', subtitle: '', linkUrl: '', placement: 'HOME_HERO' as const, sortOrder: '0' };

export default function AdminBannersPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get<{ banners: Banner[] }>('/api/admin/banners').then((d) => setItems(d.banners));
  }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('A banner image is required.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('image', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/banners`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new ApiClientError(res.status, json.message);
      setForm(emptyForm);
      setFile(null);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b: Banner) {
    await api.patch(`/api/admin/banners/${b.id}`, { isActive: !b.isActive });
    load();
  }

  async function remove(b: Banner) {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    await api.delete(`/api/admin/banners/${b.id}`);
    load();
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Banners</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 mb-8 space-y-4" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs opacity-60 block mb-1">Title</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs opacity-60 block mb-1">Subtitle</label>
            <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs opacity-60 block mb-1">Placement</label>
            <select value={form.placement} onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value as typeof f.placement }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle}>
              <option value="HOME_HERO">Home Hero</option>
              <option value="HOME_PROMO">Home Promo</option>
              <option value="SHOP_TOP">Shop Top</option>
            </select>
          </div>
          <div>
            <label className="text-xs opacity-60 block mb-1">Link URL</label>
            <input value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Image</label>
          <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="btn-luxury btn-gold-solid text-xs" disabled={saving}><span>{saving ? 'Uploading…' : 'Add Banner'}</span></button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((b) => (
          <div key={b.id} className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
            <div className="relative aspect-[16/9]">
              <Image src={getUploadUrl(b.imageUrl)} alt={b.title} fill className="object-cover" />
            </div>
            <div className="p-4">
              <p className="serif text-lg">{b.title}</p>
              <p className="text-xs opacity-60 mb-3">{b.placement.replace(/_/g, ' ')}</p>
              <div className="flex items-center justify-between">
                <button onClick={() => toggleActive(b)} className="text-xs uppercase" style={{ color: b.isActive ? 'var(--gold-deep)' : '#999' }}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => remove(b)} className="text-xs underline opacity-60">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm opacity-50">No banners yet.</p>}
      </div>
    </div>
  );
}

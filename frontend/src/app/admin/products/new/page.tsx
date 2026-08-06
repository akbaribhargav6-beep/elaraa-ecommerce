'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CategoryDTO, ProductDTO } from '@elaraa/shared';
import { api, ApiClientError } from '@/lib/api-client';

const inputStyle = { borderColor: 'rgba(43,38,32,.2)' };

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    categoryId: '',
    eyebrow: '',
    shortDescription: '',
    description: '',
    material: '',
    basePrice: '',
    compareAtPrice: '',
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
  });

  useEffect(() => {
    api.get<{ categories: CategoryDTO[] }>('/api/admin/categories').then((d) => {
      setCategories(d.categories);
      if (d.categories[0]) setForm((f) => ({ ...f, categoryId: d.categories[0].id }));
    });
  }, []);

  function slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const product = await api.post<{ product: ProductDTO }>('/api/admin/products', {
        ...form,
        basePrice: Number(form.basePrice),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      });
      router.push(`/admin/products/${product.product.id}/edit`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="serif text-3xl mb-8">New Product</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 space-y-5" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs opacity-60 block mb-1">Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs opacity-60 block mb-1">Slug</label>
            <input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="text-xs opacity-60 block mb-1">Category</label>
          <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs opacity-60 block mb-1">Eyebrow (small tagline)</label>
          <input value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="text-xs opacity-60 block mb-1">Material</label>
          <input value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} placeholder="e.g. Gold Tone Finish, Pearl" className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="text-xs opacity-60 block mb-1">Short Description</label>
          <input value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>

        <div>
          <label className="text-xs opacity-60 block mb-1">Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs opacity-60 block mb-1">Base Price (₹)</label>
            <input required type="number" min="0" step="0.01" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs opacity-60 block mb-1">Compare-at Price (₹, optional)</label>
            <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          {(['isActive', 'isFeatured', 'isNewArrival', 'isBestSeller'] as const).map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
              {key.replace('is', '')}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button className="btn-luxury btn-gold-solid" disabled={saving}><span>{saving ? 'Creating…' : 'Create Product'}</span></button>
        <p className="text-xs opacity-50">You'll add variants and images on the next screen.</p>
      </form>
    </div>
  );
}

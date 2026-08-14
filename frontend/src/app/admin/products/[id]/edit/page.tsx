'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { CategoryDTO, ProductDTO } from '@elaraa/shared';
import { api, ApiClientError, getUploadUrl, getAccessToken } from '@/lib/api-client';

const inputStyle = { borderColor: 'rgba(43,38,32,.2)' };

interface ProductForm {
  name: string;
  slug: string;
  categoryId: string;
  eyebrow: string;
  shortDescription: string;
  description: string;
  material: string;
  basePrice: string;
  compareAtPrice: string;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isComboEligible: boolean;
}

function toForm(p: ProductDTO, categoryId: string): ProductForm {
  return {
    name: p.name,
    slug: p.slug,
    categoryId,
    eyebrow: p.eyebrow ?? '',
    shortDescription: p.shortDescription ?? '',
    description: p.description ?? '',
    material: p.material ?? '',
    basePrice: String(p.basePrice),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    isComboEligible: p.isComboEligible,
  };
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [form, setForm] = useState<ProductForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newVariant, setNewVariant] = useState({ sku: '', metalLabel: '', metalHex: '#C9A66B', backType: '', size: '', stockQuantity: '0' });
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploading = uploadProgress !== null;

  function load() {
    Promise.all([
      api.get<{ product: ProductDTO }>(`/api/admin/products/${params.id}`),
      api.get<{ categories: CategoryDTO[] }>('/api/admin/categories'),
    ]).then(([productData, categoriesData]) => {
      setProduct(productData.product);
      setCategories(categoriesData.categories);
      const matched = categoriesData.categories.find((c) => c.slug === productData.product.categorySlug);
      setForm(toForm(productData.product, matched?.id ?? categoriesData.categories[0]?.id ?? ''));
    });
  }
  useEffect(load, [params.id]);

  function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSaving(true);
    try {
      await api.patch(`/api/admin/products/${params.id}`, {
        name: form.name,
        slug: form.slug,
        categoryId: form.categoryId,
        eyebrow: form.eyebrow || undefined,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        material: form.material || undefined,
        basePrice: Number(form.basePrice),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        isBestSeller: form.isBestSeller,
        isComboEligible: form.isComboEligible,
      });
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function addVariant(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/api/admin/products/${params.id}/variants`, {
      ...newVariant,
      stockQuantity: Number(newVariant.stockQuantity),
    });
    setNewVariant({ sku: '', metalLabel: '', metalHex: '#C9A66B', backType: '', size: '', stockQuantity: '0' });
    load();
  }

  async function toggleVariantActive(variantId: string, isActive: boolean) {
    await api.patch(`/api/admin/products/${params.id}/variants/${variantId}`, { isActive: !isActive });
    load();
  }

  async function removeVariant(variantId: string) {
    await api.delete(`/api/admin/products/${params.id}/variants/${variantId}`);
    load();
  }

  async function uploadOneImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${params.id}/images`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? `Upload failed (${res.status})`);
    }
  }

  // The upload endpoint accepts one file per request, so multiple selected
  // photos are uploaded sequentially (not in parallel) to keep progress
  // reporting accurate and avoid hammering the server with a burst of
  // simultaneous multipart requests. A failure on one file (e.g. it's over
  // the size limit) no longer silently drops that photo — it's collected
  // and shown so the admin knows which file didn't make it in and why.
  async function handleImageUpload(files: FileList) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploadProgress({ done: 0, total: list.length });
    setUploadError(null);
    const failures: string[] = [];
    try {
      for (let i = 0; i < list.length; i++) {
        try {
          await uploadOneImage(list[i]);
        } catch (err) {
          failures.push(`${list[i].name}: ${err instanceof Error ? err.message : 'Upload failed'}`);
        }
        setUploadProgress({ done: i + 1, total: list.length });
      }
      load();
      setUploadError(failures.length > 0 ? failures.join('\n') : null);
    } finally {
      setUploadProgress(null);
    }
  }

  async function removeImage(imageId: string) {
    await api.delete(`/api/admin/products/${params.id}/images/${imageId}`);
    load();
  }

  async function setPrimaryImage(imageId: string) {
    await api.patch(`/api/admin/products/${params.id}/images/${imageId}`, { isPrimary: true });
    load();
  }

  if (!product || !form) return <p className="text-sm opacity-60">Loading…</p>;

  const flagFields: { key: keyof Pick<ProductForm, 'isActive' | 'isFeatured' | 'isNewArrival' | 'isBestSeller' | 'isComboEligible'>; label: string }[] = [
    { key: 'isActive', label: 'Active' },
    { key: 'isFeatured', label: 'Featured' },
    { key: 'isNewArrival', label: 'New Arrival' },
    { key: 'isBestSeller', label: 'Best Seller' },
    { key: 'isComboEligible', label: 'Combo Eligible' },
  ];

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="serif text-3xl">{product.name}</h1>

      {/* ── Details ── */}
      <form onSubmit={handleSave} className="bg-white p-8 space-y-5" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <h2 className="serif text-xl mb-2">Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs opacity-60 block mb-1">Name</label>
            <input required value={form.name} onChange={(e) => updateField('name', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs opacity-60 block mb-1">Slug</label>
            <input required value={form.slug} onChange={(e) => updateField('slug', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Category</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => updateField('categoryId', e.target.value)}
            className="w-full border p-2 text-sm bg-transparent outline-none"
            style={inputStyle}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Eyebrow</label>
          <input value={form.eyebrow} onChange={(e) => updateField('eyebrow', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Material</label>
          <input value={form.material} onChange={(e) => updateField('material', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Short Description</label>
          <input value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs opacity-60 block mb-1">Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs opacity-60 block mb-1">Base Price (₹)</label>
            <input required type="number" min="0" step="0.01" value={form.basePrice} onChange={(e) => updateField('basePrice', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs opacity-60 block mb-1">Compare-at Price (₹)</label>
            <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => updateField('compareAtPrice', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          {flagFields.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={form[key]} onChange={(e) => updateField(key, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="btn-luxury btn-gold-solid" disabled={saving}><span>{saving ? 'Saving…' : 'Save Details'}</span></button>
      </form>

      {/* ── Images ── */}
      <div className="bg-white p-8" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <h2 className="serif text-xl mb-4">Images</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
          {product.images.map((img) => (
            <div key={img.id} className="relative aspect-square">
              <Image src={getUploadUrl(img.url)} alt="" fill className="object-cover" />
              {img.isPrimary && <span className="absolute top-1 left-1 text-[9px] uppercase bg-white px-1">Primary</span>}
              <div className="absolute bottom-1 right-1 flex gap-1">
                {!img.isPrimary && (
                  <button onClick={() => setPrimaryImage(img.id)} className="text-[9px] bg-white px-1" title="Set primary">★</button>
                )}
                <button onClick={() => removeImage(img.id)} className="text-[9px] bg-white px-1" title="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleImageUpload(e.target.files);
            e.target.value = '';
          }}
          className="text-sm"
        />
        <p className="text-[11px] opacity-50 mt-1">Select multiple photos at once (JPEG, PNG, or WebP, up to 10MB each).</p>
        {uploadProgress && (
          <p className="text-xs opacity-60 mt-2">Uploading {uploadProgress.done} of {uploadProgress.total}…</p>
        )}
        {uploadError && (
          <p className="text-xs text-red-700 mt-2 whitespace-pre-line">{uploadError}</p>
        )}
      </div>

      {/* ── Variants ── */}
      <div className="bg-white p-8" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <h2 className="serif text-xl mb-4">Variants</h2>
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="py-2 font-normal opacity-60">SKU</th>
              <th className="py-2 font-normal opacity-60">Metal</th>
              <th className="py-2 font-normal opacity-60">Back Type</th>
              <th className="py-2 font-normal opacity-60">Size</th>
              <th className="py-2 font-normal opacity-60">Stock</th>
              <th className="py-2 font-normal opacity-60">Status</th>
              <th className="py-2 font-normal opacity-60"></th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v) => (
              <tr key={v.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="py-2">{v.sku}</td>
                <td className="py-2">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: v.metalHex ?? '#ccc' }} />
                  {v.metalLabel}
                </td>
                <td className="py-2 opacity-60">{v.backType ?? '—'}</td>
                <td className="py-2 opacity-60">{v.size ?? '—'}</td>
                <td className="py-2">{v.stockQuantity}</td>
                <td className="py-2">
                  <button onClick={() => toggleVariantActive(v.id, v.isActive)} className="text-xs uppercase" style={{ color: v.isActive ? 'var(--gold-deep)' : '#999' }}>
                    {v.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-2"><button onClick={() => removeVariant(v.id)} className="text-xs underline opacity-60">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={addVariant} className="grid sm:grid-cols-6 gap-3 items-end">
          <input required placeholder="SKU" value={newVariant.sku} onChange={(e) => setNewVariant((v) => ({ ...v, sku: e.target.value }))} className="border p-2 text-xs bg-transparent outline-none" style={inputStyle} />
          <input required placeholder="Metal label" value={newVariant.metalLabel} onChange={(e) => setNewVariant((v) => ({ ...v, metalLabel: e.target.value }))} className="border p-2 text-xs bg-transparent outline-none" style={inputStyle} />
          <input type="color" value={newVariant.metalHex} onChange={(e) => setNewVariant((v) => ({ ...v, metalHex: e.target.value }))} className="border p-1 h-9" style={inputStyle} />
          <input placeholder="Back type" value={newVariant.backType} onChange={(e) => setNewVariant((v) => ({ ...v, backType: e.target.value }))} className="border p-2 text-xs bg-transparent outline-none" style={inputStyle} />
          <input placeholder="Size (e.g. S, M, L or 6, 7, 8)" value={newVariant.size} onChange={(e) => setNewVariant((v) => ({ ...v, size: e.target.value }))} className="border p-2 text-xs bg-transparent outline-none" style={inputStyle} />
          <input type="number" min="0" placeholder="Stock" value={newVariant.stockQuantity} onChange={(e) => setNewVariant((v) => ({ ...v, stockQuantity: e.target.value }))} className="border p-2 text-xs bg-transparent outline-none" style={inputStyle} />
          <button className="text-xs underline sm:col-span-6 w-fit">+ Add Variant</button>
        </form>
        <p className="text-[11px] opacity-50 mt-2">Leave Size blank for products that don&apos;t need one (e.g. earrings) — Back Type works the same way.</p>
      </div>
    </div>
  );
}

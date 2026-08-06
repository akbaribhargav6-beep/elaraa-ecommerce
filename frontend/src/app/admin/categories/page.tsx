'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api, ApiClientError, getAccessToken, getCategoryImageUrl } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

const inputStyle = { borderColor: 'rgba(43,38,32,.2)' };
const EMPTY_FORM = { name: '', slug: '', description: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    api.get<{ categories: Category[] }>('/api/admin/categories').then((d) => setCategories(d.categories));
  }
  useEffect(load, []);

  function slugify(s: string) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function onPickImage(file: File | undefined) {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('slug', form.slug);
      if (form.description) formData.append('description', form.description);
      if (imageFile) formData.append('image', imageFile);

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`;
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new ApiClientError(res.status, json?.message ?? 'Something went wrong.');

      resetForm();
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '' });
    setImageFile(null);
    setImagePreview(getCategoryImageUrl(c.imageUrl));
  }

  async function toggleActive(c: Category) {
    await api.patch(`/api/admin/categories/${c.id}`, { isActive: !c.isActive });
    load();
  }

  async function handleDelete(c: Category) {
    const result = await api.delete<{ hardDeleted: boolean; reason?: string }>(`/api/admin/categories/${c.id}`);
    if (!result.hardDeleted) alert(result.reason);
    load();
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Categories</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 mb-8 grid sm:grid-cols-5 gap-4 items-end" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <div className="sm:col-span-1">
          <label className="text-xs opacity-60 block mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editingId ? f.slug : slugify(e.target.value) }))}
            className="w-full border p-2 text-sm bg-transparent outline-none"
            style={inputStyle}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs opacity-60 block mb-1">Slug</label>
          <input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs opacity-60 block mb-1">Description</label>
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs opacity-60 block mb-1">Image</label>
          <div className="flex items-center gap-2">
            {imagePreview && (
              <div className="relative w-10 h-10 shrink-0 rounded-sm overflow-hidden bg-cream border" style={{ borderColor: 'rgba(43,38,32,.15)' }}>
                <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onPickImage(e.target.files?.[0])}
              className="text-xs w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button disabled={saving} className="btn-luxury btn-gold-solid text-xs"><span>{saving ? 'Saving…' : editingId ? 'Update' : 'Add Category'}</span></button>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs opacity-60">
              Cancel
            </button>
          )}
        </div>
      </form>
      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Image</th>
              <th className="p-4 font-normal opacity-60">Name</th>
              <th className="p-4 font-normal opacity-60">Slug</th>
              <th className="p-4 font-normal opacity-60">Products</th>
              <th className="p-4 font-normal opacity-60">Status</th>
              <th className="p-4 font-normal opacity-60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4">
                  <div className="relative w-10 h-10 rounded-sm overflow-hidden bg-cream border" style={{ borderColor: 'rgba(43,38,32,.1)' }}>
                    {c.imageUrl ? (
                      <Image src={getCategoryImageUrl(c.imageUrl)!} alt={c.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] opacity-40">No image</div>
                    )}
                  </div>
                </td>
                <td className="p-4">{c.name}</td>
                <td className="p-4 opacity-60">{c.slug}</td>
                <td className="p-4">{c.productCount}</td>
                <td className="p-4">
                  <button onClick={() => toggleActive(c)} className="text-xs uppercase" style={{ color: c.isActive ? 'var(--gold-deep)' : '#999' }}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4 space-x-3">
                  <button onClick={() => startEdit(c)} className="text-xs underline">Edit</button>
                  <button onClick={() => handleDelete(c)} className="text-xs underline opacity-60">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

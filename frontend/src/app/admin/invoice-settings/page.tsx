'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ApiClientError, getAccessToken, getUploadUrl } from '@/lib/api-client';

interface InvoiceSettings {
  companyName: string;
  companyLogoUrl: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  gstNumber: string | null;
  website: string | null;
  invoicePrefix: string;
  termsAndConditions: string | null;
  footerMessage: string | null;
}

const EMPTY: InvoiceSettings = {
  companyName: '',
  companyLogoUrl: null,
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  phone: '',
  email: '',
  gstNumber: '',
  website: '',
  invoicePrefix: 'INV-',
  termsAndConditions: '',
  footerMessage: '',
};

const inputStyle = { borderColor: 'rgba(43,38,32,.2)' };

export default function AdminInvoiceSettingsPage() {
  const [form, setForm] = useState<InvoiceSettings>(EMPTY);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/invoice-settings`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const s = json.data.settings as InvoiceSettings;
        setForm({ ...EMPTY, ...s });
        setLogoPreview(getUploadUrl(s.companyLogoUrl));
      })
      .finally(() => setLoading(false));
  }, []);

  function onPickLogo(file: File | undefined) {
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function set<K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('companyName', form.companyName);
      formData.append('addressLine1', form.addressLine1);
      formData.append('addressLine2', form.addressLine2 ?? '');
      formData.append('city', form.city);
      formData.append('state', form.state);
      formData.append('postalCode', form.postalCode);
      formData.append('country', form.country);
      formData.append('phone', form.phone);
      formData.append('email', form.email);
      formData.append('gstNumber', form.gstNumber ?? '');
      formData.append('website', form.website ?? '');
      formData.append('invoicePrefix', form.invoicePrefix);
      formData.append('termsAndConditions', form.termsAndConditions ?? '');
      formData.append('footerMessage', form.footerMessage ?? '');
      if (logoFile) formData.append('logo', logoFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/invoice-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new ApiClientError(res.status, json?.message ?? 'Something went wrong.');

      const s = json.data.settings as InvoiceSettings;
      setForm({ ...EMPTY, ...s });
      setLogoFile(null);
      setLogoPreview(getUploadUrl(s.companyLogoUrl));
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm opacity-60">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="serif text-3xl mb-2">Invoice Settings</h1>
      <p className="text-sm opacity-60 mb-8">
        Configure your company details once — every invoice generated from here on (order-based or manual) will
        automatically use the latest saved logo and details.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Company</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs opacity-60 block mb-1">Company Logo</label>
              <div className="flex items-center gap-3">
                <div
                  className="relative w-16 h-16 shrink-0 rounded-sm overflow-hidden bg-cream border flex items-center justify-center"
                  style={{ borderColor: 'rgba(43,38,32,.15)' }}
                >
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Logo preview" fill className="object-contain" unoptimized />
                  ) : (
                    <span className="text-[9px] opacity-40">No logo</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                  className="text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Company Name</label>
              <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Website</label>
              <input value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} placeholder="https://" />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">GST Number</label>
              <input value={form.gstNumber ?? ''} onChange={(e) => set('gstNumber', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
          </div>
        </section>

        <section className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Address</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs opacity-60 block mb-1">Address Line 1</label>
              <input value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs opacity-60 block mb-1">Address Line 2</label>
              <input value={form.addressLine2 ?? ''} onChange={(e) => set('addressLine2', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">City</label>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">State</label>
              <input value={form.state} onChange={(e) => set('state', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Postal Code</label>
              <input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Country</label>
              <input value={form.country} onChange={(e) => set('country', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
          </div>
        </section>

        <section className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Invoice Numbering</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs opacity-60 block mb-1">Invoice Prefix</label>
              <input required value={form.invoicePrefix} onChange={(e) => set('invoicePrefix', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
              <p className="text-[11px] opacity-50 mt-1">Applies to future invoices only — already-issued invoice numbers never change.</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Terms &amp; Footer</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs opacity-60 block mb-1">Terms &amp; Conditions</label>
              <textarea
                rows={3}
                value={form.termsAndConditions ?? ''}
                onChange={(e) => set('termsAndConditions', e.target.value)}
                className="w-full border p-2 text-sm bg-transparent outline-none"
                style={inputStyle}
                placeholder="Shown on every invoice unless overridden per-invoice."
              />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Footer Message</label>
              <input
                value={form.footerMessage ?? ''}
                onChange={(e) => set('footerMessage', e.target.value)}
                className="w-full border p-2 text-sm bg-transparent outline-none"
                style={inputStyle}
                placeholder="Thank you for your business."
              />
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex items-center gap-4">
          <button disabled={saving} className="btn-luxury btn-gold-solid text-xs">
            <span>{saving ? 'Saving…' : 'Save Settings'}</span>
          </button>
          {savedAt && !saving && <span className="text-xs opacity-50">Saved.</span>}
        </div>
      </form>
    </div>
  );
}

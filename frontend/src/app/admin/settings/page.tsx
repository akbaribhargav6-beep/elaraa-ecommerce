'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface Setting {
  id: string;
  key: string;
  value: string;
  group: string | null;
}

const KNOWN_SETTINGS: { key: string; label: string; group: string; placeholder: string; type?: 'text' | 'checkbox' }[] = [
  { key: 'store_name', label: 'Store Name', group: 'general', placeholder: 'ELARAA' },
  { key: 'support_email', label: 'Support Email', group: 'general', placeholder: 'hello@elaraa.example' },
  { key: 'shipping_flat_fee', label: 'Flat Shipping Fee (₹)', group: 'shipping', placeholder: '99' },
  { key: 'free_shipping_threshold', label: 'Free Shipping Threshold (₹)', group: 'shipping', placeholder: '2000' },
  { key: 'gst_rate_percent', label: 'GST Rate (%)', group: 'shipping', placeholder: '3' },
  { key: 'gift_packaging_fee', label: 'Gift Packaging Fee (₹)', group: 'shipping', placeholder: '49' },
  { key: 'combo_enabled', label: 'Enable Combo Feature', group: 'combo', placeholder: 'false', type: 'checkbox' },
  { key: 'combo_min_products', label: 'Minimum Products Required', group: 'combo', placeholder: '3' },
  { key: 'combo_price', label: 'Combo Price (₹)', group: 'combo', placeholder: '1499' },
  { key: 'meta_title', label: 'Default Meta Title', group: 'seo', placeholder: 'ELARAA | Premium Fashion Jewellery' },
  { key: 'meta_description', label: 'Default Meta Description', group: 'seo', placeholder: 'Premium fashion jewellery, minimally designed for everyday wear.' },
];

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function load() {
    api.get<{ settings: Setting[] }>('/api/admin/settings').then((d) => {
      const map: Record<string, string> = {};
      d.settings.forEach((s) => { map[s.key] = s.value; });
      setSaved(map);
      setValues(map);
    });
  }
  useEffect(load, []);

  async function saveOne(key: string, group: string) {
    setSavingKey(key);
    try {
      await api.put(`/api/admin/settings/${key}`, { value: values[key] ?? '', group });
      setSaved((s) => ({ ...s, [key]: values[key] ?? '' }));
    } finally {
      setSavingKey(null);
    }
  }

  const groups = ['general', 'shipping', 'combo', 'seo'];

  return (
    <div className="max-w-2xl">
      <h1 className="serif text-3xl mb-8">Settings</h1>

      {groups.map((group) => (
        <div key={group} className="bg-white p-6 mb-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4 capitalize">{group}</h2>
          <div className="space-y-4">
            {KNOWN_SETTINGS.filter((s) => s.group === group).map((s) => (
              <div key={s.key} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs opacity-60 block mb-1">{s.label}</label>
                  {s.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-sm py-1.5">
                      <input
                        type="checkbox"
                        checked={(values[s.key] ?? 'false') === 'true'}
                        onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.checked ? 'true' : 'false' }))}
                      />
                      {(values[s.key] ?? 'false') === 'true' ? 'Enabled' : 'Disabled'}
                    </label>
                  ) : (
                    <input
                      placeholder={s.placeholder}
                      value={values[s.key] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                      className="w-full border p-2 text-sm bg-transparent outline-none"
                      style={{ borderColor: 'rgba(43,38,32,.2)' }}
                    />
                  )}
                </div>
                <button
                  onClick={() => saveOne(s.key, group)}
                  disabled={savingKey === s.key || (values[s.key] ?? '') === (saved[s.key] ?? '')}
                  className="text-xs underline disabled:opacity-30 mb-2"
                >
                  {savingKey === s.key ? 'Saving…' : 'Save'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

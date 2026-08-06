'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  metalLabel: string;
  backType: string | null;
  stockQuantity: number;
  isActive: boolean;
  isLowStock: boolean;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  function load() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (lowStockOnly) params.set('lowStock', 'true');
    api.get<{ items: InventoryItem[] }>(`/api/admin/inventory?${params.toString()}`).then((d) => setItems(d.items));
  }

  useEffect(load, [search, lowStockOnly]);

  async function submitAdjust(variantId: string) {
    const qty = parseInt(adjustQty, 10);
    if (!qty) return;
    await api.post(`/api/admin/inventory/${variantId}/adjust`, {
      changeQty: qty,
      reason: qty > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
      note: adjustNote || undefined,
    });
    setAdjusting(null);
    setAdjustQty('');
    setAdjustNote('');
    load();
  }

  return (
    <div>
      <h1 className="serif text-3xl mb-8">Inventory</h1>

      <div className="flex items-center gap-4 mb-6">
        <input
          placeholder="Search SKU or product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 text-sm bg-transparent outline-none flex-1 max-w-xs"
          style={{ borderColor: 'rgba(43,38,32,.2)' }}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Product</th>
              <th className="p-4 font-normal opacity-60">SKU</th>
              <th className="p-4 font-normal opacity-60">Variant</th>
              <th className="p-4 font-normal opacity-60">Stock</th>
              <th className="p-4 font-normal opacity-60">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4">{v.productName}</td>
                <td className="p-4 opacity-60">{v.sku}</td>
                <td className="p-4 opacity-60">{v.metalLabel}{v.backType ? ` / ${v.backType}` : ''}</td>
                <td className="p-4" style={{ color: v.isLowStock ? '#b91c1c' : undefined }}>{v.stockQuantity}</td>
                <td className="p-4">
                  {adjusting === v.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="±qty"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                        className="border p-1 text-xs w-20 bg-transparent outline-none"
                        style={{ borderColor: 'rgba(43,38,32,.2)' }}
                      />
                      <input
                        placeholder="Note"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        className="border p-1 text-xs w-32 bg-transparent outline-none"
                        style={{ borderColor: 'rgba(43,38,32,.2)' }}
                      />
                      <button onClick={() => submitAdjust(v.id)} className="text-xs underline">Save</button>
                      <button onClick={() => setAdjusting(null)} className="text-xs opacity-60">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setAdjusting(v.id)} className="text-xs underline">Adjust Stock</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

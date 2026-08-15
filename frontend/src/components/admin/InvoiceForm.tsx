'use client';

import { useEffect, useState } from 'react';
import { api, ApiClientError } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

interface InvoiceLineForm {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export interface ManualInvoiceFormValues {
  customerName: string;
  companyNameOnInvoice: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  shippingAddress: string;
  items: InvoiceLineForm[];
  taxAmount: number;
  shippingFee: number;
  notes: string;
  termsAndConditions: string;
}

interface ProductVariantOption {
  id: string;
  sku: string;
  metalLabel: string | null;
  backType: string | null;
  price: number;
}
interface ProductOption {
  id: string;
  name: string;
  variants: ProductVariantOption[];
}

const EMPTY_LINE: InvoiceLineForm = { productName: '', sku: '', quantity: 1, unitPrice: 0, discountAmount: 0 };

export function emptyInvoiceForm(): ManualInvoiceFormValues {
  return {
    customerName: '',
    companyNameOnInvoice: '',
    customerEmail: '',
    customerPhone: '',
    billingAddress: '',
    shippingAddress: '',
    items: [{ ...EMPTY_LINE }],
    taxAmount: 0,
    shippingFee: 0,
    notes: '',
    termsAndConditions: '',
  };
}

const inputStyle = { borderColor: 'rgba(43,38,32,.2)' };

function lineTotal(line: InvoiceLineForm): number {
  return Math.max(0, line.quantity * line.unitPrice - line.discountAmount);
}

export function InvoiceForm({
  initial,
  onSubmit,
  submitLabel,
  locked,
}: {
  initial: ManualInvoiceFormValues;
  onSubmit: (values: ManualInvoiceFormValues) => Promise<void>;
  submitLabel: string;
  locked?: boolean;
}) {
  const [form, setForm] = useState<ManualInvoiceFormValues>(initial);
  const [sameAsBilling, setSameAsBilling] = useState(!initial.shippingAddress || initial.shippingAddress === initial.billingAddress);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => {
    if (!productQuery.trim()) {
      setProductResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      api
        .get<{ items: ProductOption[] }>(`/api/admin/products?search=${encodeURIComponent(productQuery)}&limit=8`)
        .then((d) => setProductResults(d.items))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [productQuery]);

  function set<K extends keyof ManualInvoiceFormValues>(key: K, value: ManualInvoiceFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setLine(idx: number, patch: Partial<InvoiceLineForm>) {
    setForm((f) => ({ ...f, items: f.items.map((l, i) => (i === idx ? { ...l, ...patch } : l)) }));
  }

  function addBlankLine() {
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  }

  function addFromCatalog(product: ProductOption, variant: ProductVariantOption) {
    const label = [product.name, variant.metalLabel, variant.backType].filter(Boolean).join(' — ');
    setForm((f) => ({
      ...f,
      // Drop any untouched blank row (the form always starts with one) so it
      // doesn't sit there with an empty required product name and silently
      // block submission via native validation.
      items: [
        ...f.items.filter((l) => l.productName.trim() || l.unitPrice > 0 || l.discountAmount > 0),
        { productName: label, sku: variant.sku, quantity: 1, unitPrice: variant.price, discountAmount: 0 },
      ],
    }));
    setProductQuery('');
    setProductResults([]);
  }

  function removeLine(idx: number) {
    setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, i) => i !== idx) : f.items }));
  }

  const subtotal = form.items.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const discountTotal = form.items.reduce((s, l) => s + l.discountAmount, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + form.taxAmount + form.shippingFee);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.items.some((l) => !l.productName.trim())) {
      setError('Every line item needs a product name.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...form, shippingAddress: sameAsBilling ? '' : form.shippingAddress });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset disabled={locked} className="space-y-6">
        <section className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Customer</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs opacity-60 block mb-1">Customer Name *</label>
              <input required value={form.customerName} onChange={(e) => set('customerName', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Company Name</label>
              <input value={form.companyNameOnInvoice} onChange={(e) => set('companyNameOnInvoice', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Email</label>
              <input type="email" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Phone (for WhatsApp share)</label>
              <input value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="+91 98765 43210" className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs opacity-60 block mb-1">Billing Address *</label>
              <textarea required rows={2} value={form.billingAddress} onChange={(e) => set('billingAddress', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs opacity-70 mb-2">
                <input type="checkbox" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} />
                Shipping address same as billing
              </label>
              {!sameAsBilling && (
                <textarea rows={2} value={form.shippingAddress} onChange={(e) => set('shippingAddress', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} placeholder="Shipping address" />
              )}
            </div>
          </div>
        </section>

        <section className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Products</h2>

          <div className="relative mb-4">
            <label className="text-xs opacity-60 block mb-1">Add from catalog</label>
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full border p-2 text-sm bg-transparent outline-none"
              style={inputStyle}
            />
            {productQuery.trim() && (
              <div className="absolute z-10 left-0 right-0 bg-white mt-1 shadow-lg max-h-64 overflow-y-auto" style={{ border: '1px solid rgba(43,38,32,.1)' }}>
                {searching && <p className="text-xs p-3 opacity-50">Searching…</p>}
                {!searching && productResults.length === 0 && <p className="text-xs p-3 opacity-50">No products found.</p>}
                {productResults.map((p) =>
                  p.variants.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => addFromCatalog(p, v)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-cream flex items-center justify-between border-b"
                      style={{ borderColor: 'rgba(43,38,32,.05)' }}
                    >
                      <span>{p.name}{v.metalLabel ? ` — ${v.metalLabel}` : ''}{v.backType ? ` (${v.backType})` : ''}</span>
                      <span className="opacity-50 ml-2 whitespace-nowrap">{v.sku} · {formatPrice(v.price)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
                  <th className="py-2 font-normal opacity-60">Product</th>
                  <th className="py-2 font-normal opacity-60 w-24">SKU</th>
                  <th className="py-2 font-normal opacity-60 w-16">Qty</th>
                  <th className="py-2 font-normal opacity-60 w-24">Unit Price</th>
                  <th className="py-2 font-normal opacity-60 w-24">Discount</th>
                  <th className="py-2 font-normal opacity-60 w-24">Line Total</th>
                  <th className="py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {form.items.map((line, idx) => (
                  <tr key={idx} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                    <td className="py-2 pr-2">
                      <input required value={line.productName} onChange={(e) => setLine(idx, { productName: e.target.value })} className="w-full border p-1.5 text-xs bg-transparent outline-none" style={inputStyle} />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={line.sku} onChange={(e) => setLine(idx, { sku: e.target.value })} className="w-full border p-1.5 text-xs bg-transparent outline-none" style={inputStyle} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" min={1} value={line.quantity} onChange={(e) => setLine(idx, { quantity: Math.max(1, Number(e.target.value)) })} className="w-full border p-1.5 text-xs bg-transparent outline-none" style={inputStyle} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" min={0} step="0.01" value={line.unitPrice} onChange={(e) => setLine(idx, { unitPrice: Math.max(0, Number(e.target.value)) })} className="w-full border p-1.5 text-xs bg-transparent outline-none" style={inputStyle} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" min={0} step="0.01" value={line.discountAmount} onChange={(e) => setLine(idx, { discountAmount: Math.max(0, Number(e.target.value)) })} className="w-full border p-1.5 text-xs bg-transparent outline-none" style={inputStyle} />
                    </td>
                    <td className="py-2 pr-2 text-xs">{formatPrice(lineTotal(line))}</td>
                    <td className="py-2">
                      <button type="button" onClick={() => removeLine(idx)} className="text-xs opacity-50 hover:opacity-100">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addBlankLine} className="text-xs underline mt-3">+ Add custom line</button>
        </section>

        <section className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Charges &amp; Notes</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs opacity-60 block mb-1">Tax Amount</label>
              <input type="number" min={0} step="0.01" value={form.taxAmount} onChange={(e) => set('taxAmount', Math.max(0, Number(e.target.value)))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs opacity-60 block mb-1">Shipping Charge</label>
              <input type="number" min={0} step="0.01" value={form.shippingFee} onChange={(e) => set('shippingFee', Math.max(0, Number(e.target.value)))} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs opacity-60 block mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs opacity-60 block mb-1">Terms &amp; Conditions</label>
            <textarea rows={2} value={form.termsAndConditions} onChange={(e) => set('termsAndConditions', e.target.value)} className="w-full border p-2 text-sm bg-transparent outline-none" style={inputStyle} placeholder="Leave blank to use the default terms from Invoice Settings." />
          </div>

          <div className="divider-gold my-4" />
          <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          {discountTotal > 0 && <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Discount</span><span>−{formatPrice(discountTotal)}</span></div>}
          {form.taxAmount > 0 && <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Tax</span><span>{formatPrice(form.taxAmount)}</span></div>}
          <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Shipping</span><span>{form.shippingFee > 0 ? formatPrice(form.shippingFee) : 'Free'}</span></div>
          <div className="flex justify-between text-base font-medium mt-2"><span>Grand Total</span><span>{formatPrice(grandTotal)}</span></div>
        </section>
      </fieldset>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {!locked && (
        <button disabled={saving} className="btn-luxury btn-gold-solid text-xs">
          <span>{saving ? 'Saving…' : submitLabel}</span>
        </button>
      )}
    </form>
  );
}

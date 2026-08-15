'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiClientError, getAccessToken } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { InvoiceForm, type ManualInvoiceFormValues } from '@/components/admin/InvoiceForm';

type InvoiceType = 'ORDER' | 'MANUAL';
type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED';

interface InvoiceItemDTO {
  id: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  orderId: string | null;
  orderNumber: string | null;
  customerName: string;
  companyNameOnInvoice: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  billingAddress: string;
  shippingAddress: string | null;
  items: InvoiceItemDTO[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  orderStatus: string | null;
  notes: string | null;
  termsAndConditions: string | null;
  invoiceDate: string;
  finalizedAt: string | null;
  shareUrl: string;
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: '#8A8072',
  FINALIZED: '#047857',
  CANCELLED: '#B91C1C',
};

export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waPhone, setWaPhone] = useState('');

  function load() {
    api.get<{ invoice: InvoiceDTO }>(`/api/admin/invoices/${params.id}`).then((d) => {
      setInvoice(d.invoice);
      setWaPhone(d.invoice.customerPhone ?? '');
    });
  }
  useEffect(load, [params.id]);

  async function downloadPdf() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/invoices/${params.id}/pdf`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    if (!res.ok || !invoice) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runAction(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function sendViaWhatsApp() {
    if (!invoice) return;
    const digits = waPhone.replace(/[^\d]/g, '');
    if (!digits) {
      setError('Enter a WhatsApp number first.');
      return;
    }
    const message = `Hello${invoice.customerName ? ' ' + invoice.customerName : ''}, here is your invoice ${invoice.invoiceNumber} from us.\n\nTotal: ${formatPrice(invoice.totalAmount)}\nView / download: ${invoice.shareUrl}\n\nThank you for your business!`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  if (!invoice) return <p className="text-sm opacity-60">Loading…</p>;

  const editable = invoice.type === 'MANUAL' && invoice.status === 'DRAFT';

  if (editing && editable) {
    const initial: ManualInvoiceFormValues = {
      customerName: invoice.customerName,
      companyNameOnInvoice: invoice.companyNameOnInvoice ?? '',
      customerEmail: invoice.customerEmail ?? '',
      customerPhone: invoice.customerPhone ?? '',
      billingAddress: invoice.billingAddress,
      shippingAddress: invoice.shippingAddress ?? '',
      items: invoice.items.map((i) => ({ productName: i.productName, sku: i.sku ?? '', quantity: i.quantity, unitPrice: i.unitPrice, discountAmount: i.discountAmount })),
      taxAmount: invoice.taxAmount,
      shippingFee: invoice.shippingFee,
      notes: invoice.notes ?? '',
      termsAndConditions: invoice.termsAndConditions ?? '',
    };
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="serif text-3xl">Edit {invoice.invoiceNumber}</h1>
          <button onClick={() => setEditing(false)} className="text-xs underline opacity-60">Cancel Edit</button>
        </div>
        <InvoiceForm
          initial={initial}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            await api.patch(`/api/admin/invoices/${invoice.id}`, {
              customerName: values.customerName,
              companyNameOnInvoice: values.companyNameOnInvoice || undefined,
              customerEmail: values.customerEmail || undefined,
              customerPhone: values.customerPhone || undefined,
              billingAddress: values.billingAddress,
              shippingAddress: values.shippingAddress || undefined,
              items: values.items.map((i) => ({
                productName: i.productName,
                sku: i.sku || undefined,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                discountAmount: i.discountAmount || undefined,
              })),
              taxAmount: values.taxAmount || undefined,
              shippingFee: values.shippingFee || undefined,
              notes: values.notes || undefined,
              termsAndConditions: values.termsAndConditions || undefined,
            });
            setEditing(false);
            load();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="serif text-3xl">{invoice.invoiceNumber}</h1>
          <p className="text-sm opacity-60 mt-1">
            {new Date(invoice.invoiceDate).toLocaleString()} · <span className="uppercase">{invoice.type}</span>
            {invoice.orderNumber && (
              <>
                {' · '}
                <button onClick={() => router.push(`/admin/orders/${invoice.orderNumber}`)} className="underline">{invoice.orderNumber}</button>
              </>
            )}
          </p>
        </div>
        <span className="text-xs uppercase px-2 py-1" style={{ color: STATUS_COLORS[invoice.status], border: `1px solid ${STATUS_COLORS[invoice.status]}` }}>
          {invoice.status}
        </span>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button onClick={downloadPdf} className="btn-luxury btn-gold-solid text-xs"><span>Download PDF</span></button>
        {editable && <button onClick={() => setEditing(true)} className="text-xs underline">Edit</button>}
        {invoice.type === 'MANUAL' && invoice.status === 'DRAFT' && (
          <button disabled={busy} onClick={() => runAction(() => api.post(`/api/admin/invoices/${invoice.id}/finalize`))} className="text-xs underline">
            Finalize
          </button>
        )}
        {invoice.status !== 'CANCELLED' && (
          <button
            disabled={busy}
            onClick={() => {
              if (confirm('Cancel this invoice? It will be retained but marked cancelled.')) runAction(() => api.post(`/api/admin/invoices/${invoice.id}/cancel`));
            }}
            className="text-xs underline opacity-70"
          >
            Cancel
          </button>
        )}
        {invoice.type === 'MANUAL' && invoice.status === 'DRAFT' && (
          <button
            disabled={busy}
            onClick={() => {
              if (confirm('Delete this draft invoice permanently?')) {
                api.delete(`/api/admin/invoices/${invoice.id}`).then(() => router.push('/admin/invoices'));
              }
            }}
            className="text-xs underline opacity-50"
          >
            Delete
          </button>
        )}
      </div>

      {invoice.type === 'MANUAL' && (
        <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Send via WhatsApp</h2>
          <div className="flex items-end gap-3 max-w-md">
            <div className="flex-1">
              <label className="text-xs opacity-60 block mb-1">Customer WhatsApp Number</label>
              <input
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border p-2 text-sm bg-transparent outline-none"
                style={{ borderColor: 'rgba(43,38,32,.2)' }}
              />
            </div>
            <button onClick={sendViaWhatsApp} className="btn-luxury btn-gold-solid text-xs"><span>Send Link</span></button>
          </div>
          <p className="text-[11px] opacity-50 mt-2">Opens WhatsApp with a secure download link — the PDF itself is never sent directly.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
          <h2 className="serif text-xl mb-4">Items</h2>
          {invoice.items.map((i) => (
            <div key={i.id} className="mb-3 text-sm">
              <div className="flex justify-between">
                <span className="opacity-80">{i.productName} × {i.quantity}</span>
                <span>{formatPrice(i.lineTotal)}</span>
              </div>
              <div className="flex justify-between text-xs opacity-50">
                <span>SKU: {i.sku ?? '—'}</span>
                <span>{formatPrice(i.unitPrice)} each{i.discountAmount > 0 ? ` − ${formatPrice(i.discountAmount)}` : ''}</span>
              </div>
            </div>
          ))}
          <div className="divider-gold my-3" />
          <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Subtotal</span><span>{formatPrice(invoice.subtotal)}</span></div>
          {invoice.discountAmount > 0 && <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Discount</span><span>−{formatPrice(invoice.discountAmount)}</span></div>}
          {invoice.taxAmount > 0 && <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Tax</span><span>{formatPrice(invoice.taxAmount)}</span></div>}
          <div className="flex justify-between text-sm mb-1"><span className="opacity-60">Shipping</span><span>{invoice.shippingFee > 0 ? formatPrice(invoice.shippingFee) : 'Free'}</span></div>
          <div className="flex justify-between text-base font-medium mt-2"><span>Grand Total</span><span>{formatPrice(invoice.totalAmount)}</span></div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
            <h2 className="serif text-xl mb-4">Customer</h2>
            <p className="text-sm">{invoice.customerName}</p>
            {invoice.companyNameOnInvoice && <p className="text-sm opacity-70">{invoice.companyNameOnInvoice}</p>}
            {invoice.customerEmail && <p className="text-sm opacity-70">{invoice.customerEmail}</p>}
            {invoice.customerPhone && <p className="text-sm opacity-70 mb-3">{invoice.customerPhone}</p>}
            <p className="text-xs opacity-60 whitespace-pre-line mt-3">{invoice.billingAddress}</p>
            {invoice.shippingAddress && invoice.shippingAddress !== invoice.billingAddress && (
              <>
                <p className="text-xs opacity-40 mt-3 mb-1">Shipping</p>
                <p className="text-xs opacity-60 whitespace-pre-line">{invoice.shippingAddress}</p>
              </>
            )}
          </div>

          {(invoice.paymentMethod || invoice.paymentStatus || invoice.orderStatus) && (
            <div className="bg-white p-6 text-sm space-y-1" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
              <h2 className="serif text-xl mb-3">Order Info</h2>
              {invoice.paymentMethod && <p className="opacity-70">Payment Method: {invoice.paymentMethod}</p>}
              {invoice.paymentStatus && <p className="opacity-70">Payment Status: {invoice.paymentStatus}</p>}
              {invoice.orderStatus && <p className="opacity-70">Order Status: {invoice.orderStatus}</p>}
            </div>
          )}

          {(invoice.notes || invoice.termsAndConditions) && (
            <div className="bg-white p-6 text-sm space-y-3" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
              {invoice.notes && (
                <div>
                  <p className="text-xs opacity-60 mb-1">Notes</p>
                  <p className="opacity-80 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              {invoice.termsAndConditions && (
                <div>
                  <p className="text-xs opacity-60 mb-1">Terms &amp; Conditions</p>
                  <p className="opacity-80 whitespace-pre-line">{invoice.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

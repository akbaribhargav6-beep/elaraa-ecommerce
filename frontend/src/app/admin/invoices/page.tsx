'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getAccessToken } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

type InvoiceType = 'ORDER' | 'MANUAL';
type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED';

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  customerName: string;
  customerEmail: string | null;
  orderNumber: string | null;
  totalAmount: number;
  invoiceDate: string;
}

interface InvoiceListResponse {
  items: InvoiceListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: '#8A8072',
  FINALIZED: '#047857',
  CANCELLED: '#B91C1C',
};

export default function AdminInvoicesPage() {
  const [data, setData] = useState<InvoiceListResponse | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    api.get<InvoiceListResponse>(`/api/admin/invoices?${params.toString()}`).then(setData);
  }, [search, status, type, page]);

  async function downloadPdf(id: string, invoiceNumber: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/invoices/${id}/pdf`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="serif text-3xl">Invoices</h1>
        <Link href="/admin/invoices/new" className="btn-luxury btn-gold-solid text-xs">
          <span>+ New Invoice</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          placeholder="Search invoice #, customer, order #…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="border p-2 text-sm bg-transparent outline-none flex-1 max-w-xs"
          style={{ borderColor: 'rgba(43,38,32,.2)' }}
        />
        <select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }} className="border p-2 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }}>
          <option value="">All types</option>
          <option value="ORDER">Order</option>
          <option value="MANUAL">Manual</option>
        </select>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="border p-2 text-sm bg-transparent outline-none" style={{ borderColor: 'rgba(43,38,32,.2)' }}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="FINALIZED">Finalized</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'rgba(43,38,32,.08)' }}>
              <th className="p-4 font-normal opacity-60">Invoice #</th>
              <th className="p-4 font-normal opacity-60">Type</th>
              <th className="p-4 font-normal opacity-60">Customer</th>
              <th className="p-4 font-normal opacity-60">Order #</th>
              <th className="p-4 font-normal opacity-60">Status</th>
              <th className="p-4 font-normal opacity-60">Total</th>
              <th className="p-4 font-normal opacity-60">Date</th>
              <th className="p-4 font-normal opacity-60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((inv) => (
              <tr key={inv.id} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="p-4">
                  <Link href={`/admin/invoices/${inv.id}`} className="underline">{inv.invoiceNumber}</Link>
                </td>
                <td className="p-4 text-xs uppercase opacity-60">{inv.type}</td>
                <td className="p-4">
                  {inv.customerName}
                  {inv.customerEmail && <span className="block opacity-50 text-xs">{inv.customerEmail}</span>}
                </td>
                <td className="p-4 opacity-60">{inv.orderNumber ?? '—'}</td>
                <td className="p-4">
                  <span className="text-xs uppercase" style={{ color: STATUS_COLORS[inv.status] }}>{inv.status}</span>
                </td>
                <td className="p-4">{formatPrice(inv.totalAmount)}</td>
                <td className="p-4 opacity-60">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                <td className="p-4 space-x-3 whitespace-nowrap">
                  <Link href={`/admin/invoices/${inv.id}`} className="text-xs underline">View</Link>
                  <button onClick={() => downloadPdf(inv.id, inv.invoiceNumber)} className="text-xs underline opacity-60">PDF</button>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td className="p-4 opacity-50" colSpan={8}>No invoices found.</td></tr>}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="underline disabled:opacity-30">Previous</button>
          <span className="opacity-60">Page {data.page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="underline disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}

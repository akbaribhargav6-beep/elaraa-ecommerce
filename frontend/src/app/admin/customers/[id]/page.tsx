'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { AddressDTO, OrderDTO } from '@elaraa/shared';
import { api } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

interface CustomerDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  addresses: AddressDTO[];
  orders: OrderDTO[];
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    api.get<{ customer: CustomerDetail }>(`/api/admin/customers/${params.id}`).then((d) => setCustomer(d.customer));
  }, [params.id]);

  if (!customer) return <p className="text-sm opacity-60">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="serif text-3xl">{customer.firstName} {customer.lastName}</h1>
        <p className="text-sm opacity-60 mt-1">{customer.email} · {customer.phone ?? 'No phone on file'}</p>
        <p className="text-xs opacity-50 mt-1">
          {customer.isEmailVerified ? 'Email verified' : 'Email not verified'} · Joined {new Date(customer.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <h2 className="serif text-xl mb-4">Addresses</h2>
        {customer.addresses.length === 0 && <p className="text-sm opacity-50">No saved addresses.</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          {customer.addresses.map((a) => (
            <div key={a.id} className="text-sm p-3" style={{ background: 'var(--cream)' }}>
              <p>{a.fullName} {a.isDefault && <span className="text-xs opacity-60">(default)</span>}</p>
              <p className="opacity-70">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
              <p className="opacity-70">{a.city}, {a.state} {a.postalCode}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
        <h2 className="serif text-xl mb-4">Order History</h2>
        <table className="w-full text-sm">
          <tbody>
            {customer.orders.map((o) => (
              <tr key={o.orderNumber} className="border-b" style={{ borderColor: 'rgba(43,38,32,.06)' }}>
                <td className="py-2"><Link href={`/admin/orders/${o.orderNumber}`} className="underline">{o.orderNumber}</Link></td>
                <td className="py-2 text-xs uppercase opacity-60">{o.status.replace(/_/g, ' ')}</td>
                <td className="py-2 text-right">{formatPrice(o.totalAmount)}</td>
              </tr>
            ))}
            {customer.orders.length === 0 && <tr><td className="py-2 opacity-50">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

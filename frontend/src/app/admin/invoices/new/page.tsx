'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { InvoiceForm, emptyInvoiceForm, type ManualInvoiceFormValues } from '@/components/admin/InvoiceForm';

interface CreatedInvoice {
  id: string;
}

export default function NewInvoicePage() {
  const router = useRouter();

  async function handleSubmit(values: ManualInvoiceFormValues) {
    const body = {
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
    };
    const result = await api.post<{ invoice: CreatedInvoice }>('/api/admin/invoices', body);
    router.push(`/admin/invoices/${result.invoice.id}`);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="serif text-3xl mb-2">New Invoice</h1>
      <p className="text-sm opacity-60 mb-8">
        Create an invoice for a sale made outside the ecommerce checkout. It&apos;s saved as a draft until you finalize it.
      </p>
      <InvoiceForm initial={emptyInvoiceForm()} onSubmit={handleSubmit} submitLabel="Create Draft Invoice" />
    </div>
  );
}

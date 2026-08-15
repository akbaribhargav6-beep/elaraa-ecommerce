import type { Invoice, InvoiceItem, InvoiceSettings } from '@prisma/client';
import type {
  InvoiceDTO,
  InvoiceItemDTO,
  InvoiceListItemDTO,
  InvoiceSettingsDTO,
  InvoiceCompanySnapshotDTO,
} from '@elaraa/shared';

export function toInvoiceSettingsDTO(row: InvoiceSettings): InvoiceSettingsDTO {
  return {
    companyName: row.companyName,
    companyLogoUrl: row.companyLogoUrl,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    phone: row.phone,
    email: row.email,
    gstNumber: row.gstNumber,
    website: row.website,
    invoicePrefix: row.invoicePrefix,
    termsAndConditions: row.termsAndConditions,
    footerMessage: row.footerMessage,
  };
}

// The subset of settings that gets frozen onto Invoice.companySnapshot at
// creation time — deliberately excludes invoicePrefix/nextInvoiceSeq
// (numbering machinery, not display data) and termsAndConditions (that's
// snapshotted separately onto the Invoice's own termsAndConditions field,
// since an admin may edit a manual invoice's terms independently of the
// global default).
export function buildCompanySnapshot(row: InvoiceSettings): InvoiceCompanySnapshotDTO {
  return {
    companyName: row.companyName,
    companyLogoUrl: row.companyLogoUrl,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    phone: row.phone,
    email: row.email,
    gstNumber: row.gstNumber,
    website: row.website,
    footerMessage: row.footerMessage,
  };
}

export function toInvoiceItemDTO(item: InvoiceItem): InvoiceItemDTO {
  return {
    id: item.id,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    discountAmount: Number(item.discountAmount),
    lineTotal: Number(item.lineTotal),
  };
}

type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[];
  order?: { orderNumber: string } | null;
};

export function toInvoiceDTO(invoice: InvoiceWithRelations, shareBaseUrl: string): InvoiceDTO {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    status: invoice.status,
    orderId: invoice.orderId,
    orderNumber: invoice.order?.orderNumber ?? null,
    customerName: invoice.customerName,
    companyNameOnInvoice: invoice.companyNameOnInvoice,
    customerEmail: invoice.customerEmail,
    customerPhone: invoice.customerPhone,
    billingAddress: invoice.billingAddress,
    shippingAddress: invoice.shippingAddress,
    company: invoice.companySnapshot as unknown as InvoiceCompanySnapshotDTO,
    items: invoice.items
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toInvoiceItemDTO),
    subtotal: Number(invoice.subtotal),
    discountAmount: Number(invoice.discountAmount),
    taxAmount: Number(invoice.taxAmount),
    shippingFee: Number(invoice.shippingFee),
    totalAmount: Number(invoice.totalAmount),
    paymentMethod: invoice.paymentMethod,
    paymentStatus: invoice.paymentStatus,
    orderStatus: invoice.orderStatus,
    notes: invoice.notes,
    termsAndConditions: invoice.termsAndConditions,
    invoiceDate: invoice.invoiceDate.toISOString(),
    finalizedAt: invoice.finalizedAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    shareUrl: `${shareBaseUrl}/api/invoices/share/${invoice.accessToken}`,
  };
}

export function toInvoiceListItemDTO(invoice: InvoiceWithRelations): InvoiceListItemDTO {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    status: invoice.status,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    orderNumber: invoice.order?.orderNumber ?? null,
    totalAmount: Number(invoice.totalAmount),
    invoiceDate: invoice.invoiceDate.toISOString(),
  };
}

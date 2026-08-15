import { z } from 'zod';

export const invoiceSettingsSchema = z.object({
  companyName: z.string().optional(),
  companyLogoUrl: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  gstNumber: z.string().optional(),
  website: z.string().optional(),
  invoicePrefix: z.string().min(1).optional(),
  termsAndConditions: z.string().optional(),
  footerMessage: z.string().optional(),
});

export const manualInvoiceLineSchema = z.object({
  productName: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().min(0),
  discountAmount: z.coerce.number().min(0).optional(),
});

export const manualInvoiceSchema = z.object({
  customerName: z.string().min(1),
  companyNameOnInvoice: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  billingAddress: z.string().min(1),
  shippingAddress: z.string().optional(),
  items: z.array(manualInvoiceLineSchema).min(1, 'Add at least one product'),
  taxAmount: z.coerce.number().min(0).optional(),
  shippingFee: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

export const adminInvoiceListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'FINALIZED', 'CANCELLED']).optional(),
  type: z.enum(['ORDER', 'MANUAL']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

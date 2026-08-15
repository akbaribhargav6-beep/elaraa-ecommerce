import type { Prisma, InvoiceSettings } from '@prisma/client';
import { prisma } from '../config/db';

// A DB client or an in-flight transaction — Prisma's TransactionClient
// exposes the same model delegates, so callers inside checkout's
// $transaction can pass `tx` and get the same atomic-increment guarantee.
type Db = typeof prisma | Prisma.TransactionClient;

// InvoiceSettings is a singleton — there is always exactly one row, created
// lazily on first access rather than requiring a seed step.
async function getOrCreateRow(db: Db): Promise<InvoiceSettings> {
  const existing = await db.invoiceSettings.findFirst();
  if (existing) return existing;
  return db.invoiceSettings.create({ data: {} });
}

export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  return getOrCreateRow(prisma);
}

export interface UpdateInvoiceSettingsInput {
  companyName?: string;
  companyLogoUrl?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  gstNumber?: string | null;
  website?: string | null;
  invoicePrefix?: string;
  termsAndConditions?: string | null;
  footerMessage?: string | null;
}

export async function updateInvoiceSettings(input: UpdateInvoiceSettingsInput): Promise<InvoiceSettings> {
  const row = await getOrCreateRow(prisma);
  return prisma.invoiceSettings.update({ where: { id: row.id }, data: input });
}

// Atomically claims the next invoice number and returns the settings row it
// was claimed from. Must run inside the same transaction as the Invoice
// create it belongs to — two concurrent invoice creations (e.g. two
// customers checking out at once) increment nextInvoiceSeq via Prisma's
// atomic `increment`, so they can never be handed the same number even
// under concurrent load.
export async function claimNextInvoiceNumber(db: Db): Promise<{ invoiceNumber: string; settings: InvoiceSettings }> {
  const row = await getOrCreateRow(db);
  const claimedSeq = row.nextInvoiceSeq;
  await db.invoiceSettings.update({
    where: { id: row.id },
    data: { nextInvoiceSeq: { increment: 1 } },
  });
  const invoiceNumber = `${row.invoicePrefix}${String(claimedSeq).padStart(6, '0')}`;
  return { invoiceNumber, settings: row };
}

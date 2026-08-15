import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { InvoiceStatus, InvoiceType } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';
import { claimNextInvoiceNumber, getInvoiceSettings } from './invoiceSettings.service';
import { buildCompanySnapshot } from '../dto/invoice.dto';
import { toOrderDTO } from '../dto/order.dto';
import type { Order, OrderItem } from '@prisma/client';

export const invoiceInclude = {
  items: true,
  order: { select: { orderNumber: true } },
} satisfies Prisma.InvoiceInclude;

function formatAddress(parts: (string | null | undefined)[]): string {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join('\n');
}

// ── Order-based invoices ────────────────────────────────────────────────
// Runs inside order.service.ts checkout()'s own $transaction, so invoice
// numbering and order creation commit together atomically — a checkout
// that fails never leaves a claimed invoice number behind, and a claimed
// number is never left without an invoice. Reuses toOrderDTO so the
// invoice's totals are byte-for-byte the same numbers checkout itself
// computed (subtotal, combo discount, tax, shipping, gift fee), instead of
// a second, potentially-diverging calculation.
export async function createInvoiceFromOrderInTx(
  tx: Prisma.TransactionClient,
  order: Order & { items: OrderItem[] }
) {
  const dto = toOrderDTO(order);
  const { invoiceNumber, settings } = await claimNextInvoiceNumber(tx);

  const billingAddress = formatAddress([
    dto.shipFullName,
    dto.shipLine1,
    dto.shipLine2,
    `${dto.shipCity}, ${dto.shipState} ${dto.shipPostalCode}`,
    dto.shipCountry,
  ]);

  const items: { productName: string; sku: string | null; quantity: number; unitPrice: number; discountAmount: number; lineTotal: number }[] =
    dto.items.map((i) => ({
      productName: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountAmount: 0,
      lineTotal: i.lineTotal,
    }));
  if (dto.giftPackaging && dto.giftPackagingFee > 0) {
    items.push({
      productName: 'Gift Packaging',
      sku: null,
      quantity: 1,
      unitPrice: dto.giftPackagingFee,
      discountAmount: 0,
      lineTotal: dto.giftPackagingFee,
    });
  }

  // Coupon + combo discounts both reduce what the customer paid — folded
  // into one invoice-level discount line so subtotal − discount + tax +
  // shipping reconciles to the same total the customer was actually
  // charged (see the worked reconciliation in the PR that added this).
  const discountAmount = dto.discountAmount + dto.comboDiscount;

  return tx.invoice.create({
    data: {
      invoiceNumber,
      type: 'ORDER',
      status: 'FINALIZED',
      accessToken: crypto.randomUUID(),
      orderId: order.id,
      customerName: dto.shipFullName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      billingAddress,
      shippingAddress: billingAddress,
      companySnapshot: buildCompanySnapshot(settings) as unknown as Prisma.InputJsonValue,
      subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
      discountAmount,
      taxAmount: dto.taxAmount,
      shippingFee: dto.shippingFee,
      totalAmount: dto.totalAmount,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentStatus,
      orderStatus: dto.status,
      termsAndConditions: settings.termsAndConditions,
      finalizedAt: new Date(),
      items: {
        create: items.map((i, idx) => ({ ...i, sortOrder: idx })),
      },
    },
    include: invoiceInclude,
  });
}

// Lazily backfills an Invoice for an Order that predates this feature (or
// whose auto-creation somehow failed) — called on first "Download Invoice"
// request for that order, so existing orders keep working without a manual
// data-migration step.
async function getOrCreateInvoiceForOrder(orderId: string) {
  const existing = await prisma.invoice.findUnique({ where: { orderId }, include: invoiceInclude });
  if (existing) return existing;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw ApiError.notFound('Order not found');

  const createdId = await prisma.$transaction(async (tx) => {
    const created = await createInvoiceFromOrderInTx(tx, order);
    return created.id;
  });
  return prisma.invoice.findUniqueOrThrow({ where: { id: createdId }, include: invoiceInclude });
}

// ── Manual invoices ──────────────────────────────────────────────────────
export interface ManualInvoiceLineInput {
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

export interface ManualInvoiceInput {
  customerName: string;
  companyNameOnInvoice?: string;
  customerEmail?: string;
  customerPhone?: string;
  billingAddress: string;
  shippingAddress?: string;
  items: ManualInvoiceLineInput[];
  taxAmount?: number;
  shippingFee?: number;
  notes?: string;
  termsAndConditions?: string;
}

function lineTotal(line: ManualInvoiceLineInput): number {
  return Math.max(0, Math.round((line.quantity * line.unitPrice - (line.discountAmount ?? 0)) * 100) / 100);
}

function computeManualTotals(input: ManualInvoiceInput) {
  const subtotal = input.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountAmount = input.items.reduce((sum, i) => sum + (i.discountAmount ?? 0), 0);
  const taxAmount = input.taxAmount ?? 0;
  const shippingFee = input.shippingFee ?? 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount + shippingFee);
  return { subtotal, discountAmount, taxAmount, shippingFee, totalAmount };
}

async function createManualInvoice(input: ManualInvoiceInput, adminUserId: string) {
  if (!input.items || input.items.length === 0) {
    throw ApiError.badRequest('Add at least one product to the invoice');
  }
  const totals = computeManualTotals(input);

  const createdId = await prisma.$transaction(async (tx) => {
    const { invoiceNumber, settings } = await claimNextInvoiceNumber(tx);
    const created = await tx.invoice.create({
      data: {
        invoiceNumber,
        type: 'MANUAL',
        status: 'DRAFT',
        accessToken: crypto.randomUUID(),
        customerName: input.customerName,
        companyNameOnInvoice: input.companyNameOnInvoice,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        billingAddress: input.billingAddress,
        shippingAddress: input.shippingAddress,
        companySnapshot: buildCompanySnapshot(settings) as unknown as Prisma.InputJsonValue,
        ...totals,
        notes: input.notes,
        termsAndConditions: input.termsAndConditions ?? settings.termsAndConditions,
        createdByUserId: adminUserId,
        items: {
          create: input.items.map((i, idx) => ({
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountAmount: i.discountAmount ?? 0,
            lineTotal: lineTotal(i),
            sortOrder: idx,
          })),
        },
      },
    });
    return created.id;
  });

  return prisma.invoice.findUniqueOrThrow({ where: { id: createdId }, include: invoiceInclude });
}

async function updateManualInvoice(id: string, input: ManualInvoiceInput) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Invoice not found');
  if (existing.type !== 'MANUAL') throw ApiError.badRequest('Only manually created invoices can be edited');
  if (existing.status !== 'DRAFT') throw ApiError.badRequest('Only draft invoices can be edited — finalized invoices are locked');
  if (!input.items || input.items.length === 0) {
    throw ApiError.badRequest('Add at least one product to the invoice');
  }

  const totals = computeManualTotals(input);

  await prisma.$transaction([
    prisma.invoiceItem.deleteMany({ where: { invoiceId: id } }),
    prisma.invoice.update({
      where: { id },
      data: {
        customerName: input.customerName,
        companyNameOnInvoice: input.companyNameOnInvoice,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        billingAddress: input.billingAddress,
        shippingAddress: input.shippingAddress,
        ...totals,
        notes: input.notes,
        termsAndConditions: input.termsAndConditions,
        items: {
          create: input.items.map((i, idx) => ({
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountAmount: i.discountAmount ?? 0,
            lineTotal: lineTotal(i),
            sortOrder: idx,
          })),
        },
      },
    }),
  ]);

  return prisma.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude });
}

async function finalizeInvoice(id: string) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Invoice not found');
  if (existing.status !== 'DRAFT') throw ApiError.badRequest('Only draft invoices can be finalized');

  await prisma.invoice.update({ where: { id }, data: { status: 'FINALIZED', finalizedAt: new Date() } });
  return prisma.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude });
}

async function cancelInvoice(id: string) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Invoice not found');
  if (existing.status === 'CANCELLED') throw ApiError.badRequest('Invoice is already cancelled');

  await prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
  return prisma.invoice.findUniqueOrThrow({ where: { id }, include: invoiceInclude });
}

// Hard delete is only offered for drafts that were never finalized (never
// shown to/relied on by anyone outside the admin panel) — a finalized or
// order-backed invoice is a financial record and can only be cancelled,
// never erased, matching how the rest of this codebase treats orders.
async function deleteInvoice(id: string) {
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Invoice not found');
  if (existing.type !== 'MANUAL' || existing.status !== 'DRAFT') {
    throw ApiError.badRequest('Only draft manual invoices can be deleted — finalized invoices can be cancelled instead');
  }
  await prisma.invoice.delete({ where: { id } });
}

// ── Reads ────────────────────────────────────────────────────────────────
export interface InvoiceListParams {
  search?: string;
  status?: InvoiceStatus;
  type?: InvoiceType;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

async function listInvoices(params: InvoiceListParams) {
  const where: Prisma.InvoiceWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.type) where.type = params.type;
  if (params.search) {
    where.OR = [
      { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
      { customerName: { contains: params.search, mode: 'insensitive' } },
      { customerEmail: { contains: params.search, mode: 'insensitive' } },
      { order: { orderNumber: { contains: params.search, mode: 'insensitive' } } },
    ];
  }
  if (params.dateFrom || params.dateTo) {
    where.invoiceDate = {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(`${params.dateTo}T23:59:59.999Z`) } : {}),
    };
  }

  const [total, items] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { invoiceDate: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);

  return { items, total, page: params.page, limit: params.limit, totalPages: Math.max(1, Math.ceil(total / params.limit)) };
}

async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
}

async function getInvoiceByToken(token: string) {
  const invoice = await prisma.invoice.findUnique({ where: { accessToken: token }, include: invoiceInclude });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
}

export const invoiceService = {
  getOrCreateInvoiceForOrder,
  createManualInvoice,
  updateManualInvoice,
  finalizeInvoice,
  cancelInvoice,
  deleteInvoice,
  listInvoices,
  getInvoiceById,
  getInvoiceByToken,
};

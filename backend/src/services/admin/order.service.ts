import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { toOrderDTO } from '../../dto/order.dto';

const orderInclude = { items: true } satisfies Prisma.OrderInclude;

interface ListParams {
  search?: string;
  status?: OrderStatus;
  page: number;
  limit: number;
}

async function list(params: ListParams) {
  const where: Prisma.OrderWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: 'insensitive' } },
      { customerEmail: { contains: params.search, mode: 'insensitive' } },
      { customerPhone: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { placedAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);

  return {
    items: orders.map(toOrderDTO),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

async function getByOrderNumber(orderNumber: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
  if (!order) throw ApiError.notFound('Order not found');
  return toOrderDTO(order);
}

const RESTOCK_ON_STATUSES: OrderStatus[] = ['RETURNED', 'CANCELLED'];

async function updateStatus(orderNumber: string, adminUserId: string, input: { status: OrderStatus; note?: string }) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status === input.status) throw ApiError.badRequest(`Order is already ${input.status}`);

  const shouldRestock = RESTOCK_ON_STATUSES.includes(input.status) && !RESTOCK_ON_STATUSES.includes(order.status);
  // COD is collected on delivery — mark it paid the moment the order is delivered.
  const paymentStatus =
    input.status === 'DELIVERED' && order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING'
      ? ('PAID' as const)
      : input.status === 'REFUNDED'
        ? ('REFUNDED' as const)
        : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    if (shouldRestock) {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            changeQty: item.quantity,
            reason: input.status === 'RETURNED' ? 'RETURN' : 'ORDER_CANCELLED',
            note: `Order ${orderNumber} → ${input.status}`,
            createdByUserId: adminUserId,
          },
        });
      }
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        ...(paymentStatus ? { paymentStatus } : {}),
        statusHistory: { create: { status: input.status, note: input.note, changedByUserId: adminUserId } },
      },
      include: orderInclude,
    });
  });

  return toOrderDTO(updated);
}

async function getStatusHistory(orderNumber: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) throw ApiError.notFound('Order not found');
  return prisma.orderStatusHistory.findMany({ where: { orderId: order.id }, orderBy: { createdAt: 'asc' } });
}

// Used by the admin order-detail "Download Invoice" button — the admin
// panel is already gated by requireAuth + requireAdmin, so this skips the
// ownership check the customer-facing route needs.
async function getOrderIdByNumber(orderNumber: string): Promise<string> {
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
  if (!order) throw ApiError.notFound('Order not found');
  return order.id;
}

export const adminOrderService = { list, getByOrderNumber, updateStatus, getStatusHistory, getOrderIdByNumber };

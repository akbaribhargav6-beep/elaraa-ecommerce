import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';

const LOW_STOCK_THRESHOLD = 5;

interface ListParams {
  search?: string;
  lowStock?: boolean;
  page: number;
  limit: number;
}

async function list(params: ListParams) {
  const where: Prisma.ProductVariantWhereInput = {};
  if (params.lowStock) where.stockQuantity = { lte: LOW_STOCK_THRESHOLD };
  if (params.search) {
    where.OR = [
      { sku: { contains: params.search, mode: 'insensitive' } },
      { product: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [total, variants] = await Promise.all([
    prisma.productVariant.count({ where }),
    prisma.productVariant.findMany({
      where,
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stockQuantity: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);

  return {
    items: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      productName: v.product.name,
      productSlug: v.product.slug,
      metalLabel: v.metalLabel,
      backType: v.backType,
      stockQuantity: v.stockQuantity,
      isActive: v.isActive,
      isLowStock: v.stockQuantity <= LOW_STOCK_THRESHOLD,
    })),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

async function getLogs(variantId: string) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw ApiError.notFound('Variant not found');

  return prisma.inventoryLog.findMany({
    where: { variantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

async function adjustStock(variantId: string, adminUserId: string, input: { changeQty: number; reason: 'RESTOCK' | 'MANUAL_ADJUSTMENT'; note?: string }) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw ApiError.notFound('Variant not found');

  const newQty = variant.stockQuantity + input.changeQty;
  if (newQty < 0) throw ApiError.badRequest(`This would take stock negative (currently ${variant.stockQuantity})`);

  const [updated] = await prisma.$transaction([
    prisma.productVariant.update({ where: { id: variantId }, data: { stockQuantity: newQty } }),
    prisma.inventoryLog.create({
      data: {
        variantId,
        changeQty: input.changeQty,
        reason: input.reason,
        note: input.note,
        createdByUserId: adminUserId,
      },
    }),
  ]);

  return updated;
}

export const adminInventoryService = { list, getLogs, adjustStock };

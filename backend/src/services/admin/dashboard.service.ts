import { prisma } from '../../config/db';
import { toOrderDTO } from '../../dto/order.dto';

const LOW_STOCK_THRESHOLD = 5;

async function getStats() {
  const [revenueAgg, totalOrders, totalCustomers, lowStockCount, pendingReviews, newContactMessages, recentOrdersRaw] =
    await Promise.all([
      prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.productVariant.count({ where: { isActive: true, stockQuantity: { lte: LOW_STOCK_THRESHOLD } } }),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.contactMessage.count({ where: { status: 'NEW' } }),
      prisma.order.findMany({ take: 8, orderBy: { placedAt: 'desc' }, include: { items: true } }),
    ]);

  const lowStockVariants = await prisma.productVariant.findMany({
    where: { isActive: true, stockQuantity: { lte: LOW_STOCK_THRESHOLD } },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { stockQuantity: 'asc' },
    take: 10,
  });

  return {
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
    totalOrders,
    totalCustomers,
    lowStockCount,
    pendingReviews,
    newContactMessages,
    recentOrders: recentOrdersRaw.map(toOrderDTO),
    lowStockVariants: lowStockVariants.map((v) => ({
      id: v.id,
      sku: v.sku,
      productName: v.product.name,
      productSlug: v.product.slug,
      metalLabel: v.metalLabel,
      stockQuantity: v.stockQuantity,
    })),
  };
}

export const adminDashboardService = { getStats };

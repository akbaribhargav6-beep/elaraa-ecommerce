import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';

async function list(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      variant: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productSlug: item.product.slug,
    imageUrl: item.product.images[0]?.url ?? null,
    price: Number(item.variant?.priceOverride ?? item.product.basePrice),
    variantId: item.variantId,
    variantLabel: item.variant ? [item.variant.metalLabel, item.variant.backType, item.variant.size].filter(Boolean).join(' / ') : null,
    inStock: item.variant ? item.variant.stockQuantity > 0 : true,
    createdAt: item.createdAt.toISOString(),
  }));
}

async function add(userId: string, productId: string, variantId?: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await prisma.wishlistItem.findFirst({
    where: { userId, productId, variantId: variantId ?? null },
  });
  if (!existing) {
    await prisma.wishlistItem.create({ data: { userId, productId, variantId } });
  }

  return list(userId);
}

async function remove(userId: string, itemId: string) {
  const item = await prisma.wishlistItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) throw ApiError.notFound('Wishlist item not found');
  await prisma.wishlistItem.delete({ where: { id: itemId } });
  return list(userId);
}

export const wishlistService = { list, add, remove };

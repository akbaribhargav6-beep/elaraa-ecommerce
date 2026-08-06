import { prisma } from '../config/db';

// Recomputes a product's denormalized avgRating/reviewCount from its
// APPROVED reviews. Called whenever a review is created, or an admin
// approves/rejects/deletes one.
export async function recalculateProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count.rating,
    },
  });
}

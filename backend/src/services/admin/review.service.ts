import type { Prisma, ReviewStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { recalculateProductRating } from '../../utils/rating';

interface ListParams {
  status?: ReviewStatus;
  page: number;
  limit: number;
}

async function list(params: ListParams) {
  const where: Prisma.ReviewWhereInput = {};
  if (params.status) where.status = params.status;

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);

  return {
    items: reviews.map((r) => ({
      id: r.id,
      productName: r.product.name,
      productSlug: r.product.slug,
      customerName: `${r.user.firstName} ${r.user.lastName ?? ''}`.trim(),
      customerEmail: r.user.email,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      isVerifiedPurchase: r.orderItemId !== null,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

async function updateStatus(id: string, status: ReviewStatus) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw ApiError.notFound('Review not found');

  await prisma.review.update({ where: { id }, data: { status } });
  await recalculateProductRating(review.productId);
  return { updated: true };
}

async function remove(id: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw ApiError.notFound('Review not found');

  await prisma.review.delete({ where: { id } });
  await recalculateProductRating(review.productId);
}

export const adminReviewService = { list, updateStatus, remove };

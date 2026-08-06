import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';
import { toProductDTO } from '../dto/product.dto';
import { recalculateProductRating } from '../utils/rating';
import type { ProductListResponse } from '@elaraa/shared';

const productInclude = {
  images: true,
  variants: { where: { isActive: true } },
  category: { select: { slug: true } },
} satisfies Prisma.ProductInclude;

export interface ProductListParams {
  category?: string;
  metal?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: 'featured' | 'price_asc' | 'price_desc' | 'newest';
  search?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  page: number;
  limit: number;
}

async function list(params: ProductListParams): Promise<ProductListResponse> {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (params.category) where.category = { slug: params.category };
  if (params.featured) where.isFeatured = true;
  if (params.newArrival) where.isNewArrival = true;
  if (params.bestSeller) where.isBestSeller = true;
  if (params.search) {
    const q = params.search;
    const qLower = q.trim().toLowerCase();
    const searchOr: Prisma.ProductWhereInput[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { eyebrow: { contains: q, mode: 'insensitive' } },
      { shortDescription: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { material: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
      { category: { slug: { contains: q, mode: 'insensitive' } } },
      { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
    ];
    // Also match collection keywords ("new arrival", "best seller", etc.)
    // so a search box query can surface the same curated collections the
    // header nav links to. Guarded by a minimum length so short/unrelated
    // queries don't spuriously pull in an entire collection.
    if (qLower.length >= 3) {
      if ('new arrivals'.includes(qLower)) searchOr.push({ isNewArrival: true });
      if ('best sellers'.includes(qLower)) searchOr.push({ isBestSeller: true });
      if ('featured'.includes(qLower)) searchOr.push({ isFeatured: true });
    }
    where.OR = searchOr;
  }
  if (params.metal) {
    const metals = params.metal.split(',').map((m) => m.trim());
    where.variants = { some: { metalLabel: { in: metals }, isActive: true } };
  }
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.basePrice = {
      ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
      ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
    switch (params.sort) {
      case 'price_asc':
        return [{ basePrice: 'asc' }];
      case 'price_desc':
        return [{ basePrice: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'featured':
      default:
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }
  })();

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: productInclude,
    }),
  ]);

  return {
    items: products.map(toProductDTO),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

async function getBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: productInclude,
  });
  if (!product) throw ApiError.notFound('Product not found');
  return toProductDTO(product);
}

async function related(slug: string, limit = 4) {
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, categoryId: true } });
  if (!product) throw ApiError.notFound('Product not found');

  const items = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    take: limit,
    orderBy: { isFeatured: 'desc' },
    include: productInclude,
  });

  return items.map(toProductDTO);
}

async function listReviews(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) throw ApiError.notFound('Product not found');

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  return reviews.map((r) => ({
    id: r.id,
    userName: `${r.user.firstName} ${r.user.lastName?.[0] ?? ''}${r.user.lastName ? '.' : ''}`.trim(),
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerifiedPurchase: r.orderItemId !== null,
    createdAt: r.createdAt.toISOString(),
  }));
}

interface CreateReviewInput {
  rating: number;
  title?: string;
  body: string;
}

async function createReview(slug: string, userId: string, input: CreateReviewInput) {
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) throw ApiError.notFound('Product not found');

  // A review counts as a "verified purchase" if this user has a delivered
  // order line for this exact product.
  const purchasedItem = await prisma.orderItem.findFirst({
    where: {
      productId: product.id,
      order: { userId, status: { in: ['DELIVERED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'CONFIRMED', 'PROCESSING'] } },
    },
    select: { id: true },
  });

  // Phase 1 has no admin moderation UI yet, so reviews publish immediately
  // (status APPROVED) rather than sitting unmoderated in PENDING forever.
  await prisma.review.upsert({
    where: { userId_productId: { userId, productId: product.id } },
    create: {
      productId: product.id,
      userId,
      orderItemId: purchasedItem?.id,
      rating: input.rating,
      title: input.title,
      body: input.body,
      status: 'APPROVED',
    },
    update: {
      rating: input.rating,
      title: input.title,
      body: input.body,
      orderItemId: purchasedItem?.id,
    },
  });

  await recalculateProductRating(product.id);
  return listReviews(slug);
}

export const productService = { list, getBySlug, related, listReviews, createReview };

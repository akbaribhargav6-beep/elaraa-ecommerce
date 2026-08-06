import { prisma } from '../../config/db';

async function list(params: { page: number; limit: number }) {
  const [total, items] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);
  return { items, total, page: params.page, limit: params.limit, totalPages: Math.max(1, Math.ceil(total / params.limit)) };
}

export const adminNewsletterService = { list };

import type { ContactMessageStatus } from '@prisma/client';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';

async function list(params: { status?: ContactMessageStatus; page: number; limit: number }) {
  const where = params.status ? { status: params.status } : {};
  const [total, items] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);
  return { items, total, page: params.page, limit: params.limit, totalPages: Math.max(1, Math.ceil(total / params.limit)) };
}

async function updateStatus(id: string, status: ContactMessageStatus) {
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Message not found');
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}

export const adminContactService = { list, updateStatus };

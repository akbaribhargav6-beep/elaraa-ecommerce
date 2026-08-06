import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { toOrderDTO } from '../../dto/order.dto';

interface ListParams {
  search?: string;
  page: number;
  limit: number;
}

async function list(params: ListParams) {
  const where: Prisma.UserWhereInput = { role: 'CUSTOMER' };
  if (params.search) {
    where.OR = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  const orderSums = await prisma.order.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map((u) => u.id) }, status: { not: 'CANCELLED' } },
    _sum: { totalAmount: true },
  });
  const spendByUser = new Map(orderSums.map((s) => [s.userId, Number(s._sum.totalAmount ?? 0)]));

  return {
    items: users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      isEmailVerified: u.isEmailVerified,
      orderCount: u._count.orders,
      totalSpent: spendByUser.get(u.id) ?? 0,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

async function getById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: { orderBy: { placedAt: 'desc' }, take: 20, include: { items: true } },
    },
  });
  if (!user || user.role !== 'CUSTOMER') throw ApiError.notFound('Customer not found');

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
    addresses: user.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    })),
    orders: user.orders.map(toOrderDTO),
  };
}

export const adminCustomerService = { list, getById };

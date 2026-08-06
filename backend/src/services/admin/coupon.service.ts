import type { Coupon } from '@prisma/client';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { isForeignKeyConstraintError } from '../../utils/prismaErrors';

function toDTO(c: Coupon) {
  return {
    ...c,
    discountValue: Number(c.discountValue),
    minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
    maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
  };
}

async function list() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return coupons.map(toDTO);
}

interface CouponInput {
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive?: boolean;
}

async function create(input: CouponInput) {
  const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
  if (existing) throw ApiError.conflict('A coupon with this code already exists');
  return toDTO(await prisma.coupon.create({ data: input }));
}

async function update(id: string, input: Partial<CouponInput>) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Coupon not found');
  return toDTO(await prisma.coupon.update({ where: { id }, data: input }));
}

async function remove(id: string) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Coupon not found');
  try {
    await prisma.coupon.delete({ where: { id } });
    return { hardDeleted: true };
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      await prisma.coupon.update({ where: { id }, data: { isActive: false } });
      return { hardDeleted: false, reason: 'Coupon has been used in orders — deactivated instead of deleted.' };
    }
    throw err;
  }
}

export const adminCouponService = { list, create, update, remove };

import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';

function toDTO(d: { discountValue: unknown; category?: { name: string } | null; product?: { name: string } | null; [key: string]: unknown }) {
  return {
    ...d,
    discountValue: Number(d.discountValue),
    categoryName: d.category?.name ?? null,
    productName: d.product?.name ?? null,
  };
}

async function list() {
  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { name: true } }, product: { select: { name: true } } },
  });
  return discounts.map(toDTO);
}

interface DiscountInput {
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  scope: 'ALL' | 'CATEGORY' | 'PRODUCT';
  categoryId?: string;
  productId?: string;
  startsAt?: Date;
  expiresAt?: Date;
  isActive?: boolean;
}

async function create(input: DiscountInput) {
  const discount = await prisma.discount.create({ data: input });
  return toDTO(discount);
}

async function update(id: string, input: Partial<DiscountInput>) {
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Discount not found');
  const discount = await prisma.discount.update({ where: { id }, data: input });
  return toDTO(discount);
}

async function remove(id: string) {
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Discount not found');
  await prisma.discount.delete({ where: { id } });
}

export const adminDiscountService = { list, create, update, remove };

import { z } from 'zod';

export const createDiscountSchema = z
  .object({
    name: z.string().min(1),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.coerce.number().positive(),
    scope: z.enum(['ALL', 'CATEGORY', 'PRODUCT']),
    categoryId: z.string().optional(),
    productId: z.string().optional(),
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.scope !== 'CATEGORY' || !!d.categoryId, { message: 'categoryId is required when scope is CATEGORY' })
  .refine((d) => d.scope !== 'PRODUCT' || !!d.productId, { message: 'productId is required when scope is PRODUCT' });

export const updateDiscountSchema = z.object({
  name: z.string().min(1).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.coerce.number().positive().optional(),
  scope: z.enum(['ALL', 'CATEGORY', 'PRODUCT']).optional(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

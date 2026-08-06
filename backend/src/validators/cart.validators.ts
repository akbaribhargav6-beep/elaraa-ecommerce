import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0),
});

export const cartItemParamsSchema = z.object({
  itemId: z.string().min(1),
});

import { z } from 'zod';

export const addWishlistItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
});

export const wishlistItemParamsSchema = z.object({
  itemId: z.string().min(1),
});

import { z } from 'zod';

export const createStockNotificationSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  phone: z.string().min(6).max(20),
  email: z.string().email().optional().or(z.literal('')),
});

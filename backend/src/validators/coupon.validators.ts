import { z } from 'zod';

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().nonnegative(),
});

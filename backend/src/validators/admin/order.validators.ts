import { z } from 'zod';

export const adminOrderListQuerySchema = z.object({
  search: z.string().optional(),
  status: z
    .enum([
      'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
      'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
    'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
  ]),
  note: z.string().max(300).optional(),
});

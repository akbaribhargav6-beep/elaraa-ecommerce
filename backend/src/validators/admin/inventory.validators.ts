import { z } from 'zod';

export const inventoryListQuerySchema = z.object({
  search: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export const adjustStockSchema = z.object({
  changeQty: z.coerce.number().int().refine((n) => n !== 0, 'Change quantity cannot be zero'),
  reason: z.enum(['RESTOCK', 'MANUAL_ADJUSTMENT']),
  note: z.string().max(300).optional(),
});

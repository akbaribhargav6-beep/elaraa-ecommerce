import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export const contactListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['NEW', 'READ', 'RESPONDED', 'ARCHIVED']).optional(),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'RESPONDED', 'ARCHIVED']),
});

export const upsertSettingSchema = z.object({
  value: z.string(),
  group: z.string().optional(),
});

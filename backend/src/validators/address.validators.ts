import { z } from 'zod';

export const addressBodySchema = z.object({
  label: z.string().max(40).optional(),
  fullName: z.string().min(1),
  phone: z.string().min(6),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(3),
  country: z.string().default('India'),
  isDefault: z.boolean().optional(),
});

export const addressUpdateSchema = addressBodySchema.partial();

export const addressIdParamSchema = z.object({
  id: z.string().min(1),
});

import { z } from 'zod';

export const createBannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  linkUrl: z.string().optional(),
  placement: z.enum(['HOME_HERO', 'HOME_PROMO', 'SHOP_TOP']),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const updateBannerSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  linkUrl: z.string().optional(),
  placement: z.enum(['HOME_HERO', 'HOME_PROMO', 'SHOP_TOP']).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

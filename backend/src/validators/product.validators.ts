import { z } from 'zod';

export const productListQuerySchema = z.object({
  category: z.string().optional(),
  metal: z.string().optional(), // comma-separated metalLabel values
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(['featured', 'price_asc', 'price_desc', 'newest']).default('featured'),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  newArrival: z.coerce.boolean().optional(),
  bestSeller: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(60).default(12),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(1).max(2000),
});

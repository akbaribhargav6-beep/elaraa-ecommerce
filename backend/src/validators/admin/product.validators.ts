import { z } from 'zod';

export const adminProductListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  categoryId: z.string().min(1),
  eyebrow: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  material: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isComboEligible: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  sku: z.string().min(1),
  metalLabel: z.string().min(1),
  metalHex: z.string().optional(),
  backType: z.string().optional(),
  size: z.string().optional(),
  priceOverride: z.coerce.number().positive().optional(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateVariantSchema = createVariantSchema.partial();

export const updateImageSchema = z.object({
  altText: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isPrimary: z.boolean().optional(),
});

import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { toProductDTO } from '../../dto/product.dto';
import { getStorageProvider } from '../storage';
import { isForeignKeyConstraintError } from '../../utils/prismaErrors';

const productInclude = {
  images: true,
  variants: true,
  category: { select: { slug: true } },
} satisfies Prisma.ProductInclude;

export interface AdminProductListParams {
  search?: string;
  category?: string;
  status: 'active' | 'inactive' | 'all';
  page: number;
  limit: number;
}

async function list(params: AdminProductListParams) {
  const where: Prisma.ProductWhereInput = {};
  if (params.status === 'active') where.isActive = true;
  if (params.status === 'inactive') where.isActive = false;
  if (params.category) where.category = { slug: params.category };
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { slug: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: productInclude,
    }),
  ]);

  return {
    items: products.map(toProductDTO),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

async function getById(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw ApiError.notFound('Product not found');
  return toProductDTO(product);
}

interface ProductInput {
  name: string;
  slug: string;
  categoryId: string;
  eyebrow?: string;
  shortDescription?: string;
  description?: string;
  material?: string;
  basePrice: number;
  compareAtPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isComboEligible?: boolean;
}

async function create(input: ProductInput) {
  const existing = await prisma.product.findUnique({ where: { slug: input.slug } });
  if (existing) throw ApiError.conflict('A product with this slug already exists');

  const product = await prisma.product.create({
    data: { ...input, publishedAt: input.isActive !== false ? new Date() : null },
    include: productInclude,
  });
  return toProductDTO(product);
}

async function update(id: string, input: Partial<ProductInput>) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Product not found');

  if (input.slug && input.slug !== existing.slug) {
    const slugTaken = await prisma.product.findUnique({ where: { slug: input.slug } });
    if (slugTaken) throw ApiError.conflict('A product with this slug already exists');
  }

  const product = await prisma.product.update({ where: { id }, data: input, include: productInclude });
  return toProductDTO(product);
}

async function remove(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Product not found');

  try {
    await prisma.product.delete({ where: { id } });
    return { hardDeleted: true };
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      // Referenced by existing orders — deactivate instead of destroying order history.
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return { hardDeleted: false, reason: 'Product has order history — deactivated instead of deleted.' };
    }
    throw err;
  }
}

// ── Variants ──────────────────────────────────────────────────────
interface VariantInput {
  sku: string;
  metalLabel: string;
  metalHex?: string;
  backType?: string;
  size?: string;
  priceOverride?: number;
  stockQuantity: number;
  isDefault?: boolean;
  isActive?: boolean;
}

async function addVariant(productId: string, input: VariantInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  const skuTaken = await prisma.productVariant.findUnique({ where: { sku: input.sku } });
  if (skuTaken) throw ApiError.conflict('A variant with this SKU already exists');

  if (input.isDefault) {
    await prisma.productVariant.updateMany({ where: { productId }, data: { isDefault: false } });
  }

  const variant = await prisma.productVariant.create({ data: { ...input, productId } });

  if (input.stockQuantity > 0) {
    await prisma.inventoryLog.create({
      data: { variantId: variant.id, changeQty: input.stockQuantity, reason: 'RESTOCK', note: 'Variant created' },
    });
  }

  return getById(productId);
}

async function updateVariant(productId: string, variantId: string, input: Partial<VariantInput>) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) throw ApiError.notFound('Variant not found');

  if (input.isDefault) {
    await prisma.productVariant.updateMany({ where: { productId }, data: { isDefault: false } });
  }

  await prisma.productVariant.update({ where: { id: variantId }, data: input });
  return getById(productId);
}

async function removeVariant(productId: string, variantId: string) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) throw ApiError.notFound('Variant not found');

  try {
    await prisma.productVariant.delete({ where: { id: variantId } });
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      await prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
    } else {
      throw err;
    }
  }
  return getById(productId);
}

// ── Images ────────────────────────────────────────────────────────
async function addImage(productId: string, file: Express.Multer.File) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  const storage = getStorageProvider();
  const ext = file.originalname.split('.').pop() ?? 'jpg';
  const key = `products/${product.slug}/${Date.now()}.${ext}`;
  const saved = await storage.save(key, file.buffer, file.mimetype);

  const count = await prisma.productImage.count({ where: { productId } });
  const image = await prisma.productImage.create({
    data: { productId, url: saved.url, sortOrder: count, isPrimary: count === 0 },
  });
  return image;
}

async function updateImage(productId: string, imageId: string, input: { altText?: string; sortOrder?: number; isPrimary?: boolean }) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) throw ApiError.notFound('Image not found');

  if (input.isPrimary) {
    await prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
  }
  return prisma.productImage.update({ where: { id: imageId }, data: input });
}

async function removeImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) throw ApiError.notFound('Image not found');
  await prisma.productImage.delete({ where: { id: imageId } });
}

export const adminProductService = {
  list,
  getById,
  create,
  update,
  remove,
  addVariant,
  updateVariant,
  removeVariant,
  addImage,
  updateImage,
  removeImage,
};

import type { Product, ProductImage, ProductVariant } from '@prisma/client';
import type { ProductDTO, ProductImageDTO, ProductVariantDTO } from '@elaraa/shared';

type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  category: { slug: string };
};

export function toImageDTO(img: ProductImage): ProductImageDTO {
  return {
    id: img.id,
    url: img.url,
    altText: img.altText,
    sortOrder: img.sortOrder,
    isPrimary: img.isPrimary,
  };
}

export function toVariantDTO(v: ProductVariant): ProductVariantDTO {
  return {
    id: v.id,
    sku: v.sku,
    metalLabel: v.metalLabel,
    metalHex: v.metalHex,
    backType: v.backType,
    size: v.size,
    price: Number(v.priceOverride ?? 0) || 0,
    stockQuantity: v.stockQuantity,
    isDefault: v.isDefault,
    isActive: v.isActive,
  };
}

export function toProductDTO(product: ProductWithRelations): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categorySlug: product.category.slug,
    eyebrow: product.eyebrow,
    shortDescription: product.shortDescription,
    description: product.description,
    material: product.material,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isComboEligible: product.isComboEligible,
    avgRating: Number(product.avgRating),
    reviewCount: product.reviewCount,
    images: product.images
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toImageDTO),
    variants: product.variants.map((v) => {
      const dto = toVariantDTO(v);
      // Variants without their own priceOverride fall back to the product's base price.
      dto.price = v.priceOverride ? Number(v.priceOverride) : Number(product.basePrice);
      return dto;
    }),
  };
}

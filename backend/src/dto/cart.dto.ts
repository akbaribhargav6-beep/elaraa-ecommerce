import type { Cart, CartItem, Product, ProductVariant } from '@prisma/client';
import type { CartDTO, CartItemDTO } from '@elaraa/shared';

type CartItemWithRelations = CartItem & { product: Product; variant: ProductVariant };
type CartWithItems = Cart & { items: CartItemWithRelations[] };

function variantLabel(variant: ProductVariant): string {
  return [variant.metalLabel, variant.backType].filter(Boolean).join(' / ');
}

export function toCartDTO(cart: CartWithItems, primaryImageByProduct: Map<string, string | null>): CartDTO {
  const items: CartItemDTO[] = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productSlug: item.product.slug,
    variantId: item.variantId,
    variantLabel: variantLabel(item.variant),
    imageUrl: primaryImageByProduct.get(item.productId) ?? null,
    unitPrice: Number(item.priceSnapshot),
    quantity: item.quantity,
    lineTotal: Number(item.priceSnapshot) * item.quantity,
    stockQuantity: item.variant.stockQuantity,
  }));

  return {
    id: cart.id,
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

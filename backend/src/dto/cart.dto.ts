import type { Cart, CartItem, Product, ProductVariant } from '@prisma/client';
import type { CartDTO, CartItemDTO, ComboSelectionItem } from '@elaraa/shared';

type CartItemWithRelations = CartItem & { product: Product; variant: ProductVariant };
type CartWithItems = Cart & { items: CartItemWithRelations[] };

function variantLabel(variant: ProductVariant): string {
  return [variant.metalLabel, variant.backType].filter(Boolean).join(' / ');
}

export function toCartDTO(cart: CartWithItems, primaryImageByProduct: Map<string, string | null>): CartDTO {
  const items: CartItemDTO[] = cart.items.map((item) => {
    const comboSelection = (item.comboSelection as ComboSelectionItem[] | null) ?? null;
    return {
      id: item.id,
      productId: item.productId,
      productName: comboSelection ? `Custom Combo Set (${comboSelection.length} items)` : item.product.name,
      productSlug: item.product.slug,
      variantId: item.variantId,
      variantLabel: comboSelection ? `${comboSelection.length} products selected` : variantLabel(item.variant),
      // A combo line has no image of its own — borrow the first selected
      // product's photo so it isn't blank in the cart drawer/page.
      imageUrl: comboSelection ? (comboSelection[0]?.imageUrl ?? null) : (primaryImageByProduct.get(item.productId) ?? null),
      unitPrice: Number(item.priceSnapshot),
      quantity: item.quantity,
      lineTotal: Number(item.priceSnapshot) * item.quantity,
      stockQuantity: item.variant.stockQuantity,
      isCombo: comboSelection !== null,
      comboSelection,
    };
  });

  return {
    id: cart.id,
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

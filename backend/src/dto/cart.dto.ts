import type { Cart, CartItem, Product, ProductVariant } from '@prisma/client';
import type { CartDTO, CartItemDTO, ComboGroupDTO } from '@elaraa/shared';

type CartItemWithRelations = CartItem & { product: Product; variant: ProductVariant };
type CartWithItems = Cart & { items: CartItemWithRelations[] };

function variantLabel(variant: ProductVariant): string {
  return [variant.metalLabel, variant.backType, variant.size].filter(Boolean).join(' / ');
}

function buildComboGroups(items: CartItemWithRelations[]): ComboGroupDTO[] {
  const groups = new Map<string, ComboGroupDTO>();
  for (const item of items) {
    if (!item.comboGroupId) continue;
    let group = groups.get(item.comboGroupId);
    if (!group) {
      group = {
        groupId: item.comboGroupId,
        name: item.comboGroupName ?? 'Combo',
        originalTotal: 0,
        comboPrice: Number(item.comboGroupPrice ?? 0),
        discount: 0,
        itemIds: [],
      };
      groups.set(item.comboGroupId, group);
    }
    group.originalTotal += Number(item.priceSnapshot) * item.quantity;
    group.itemIds.push(item.id);
  }
  for (const group of groups.values()) {
    group.discount = Math.max(0, group.originalTotal - group.comboPrice);
  }
  return [...groups.values()];
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
    comboGroupId: item.comboGroupId || null,
    comboGroupName: item.comboGroupName,
  }));

  const comboGroups = buildComboGroups(cart.items);

  return {
    id: cart.id,
    items,
    subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    comboGroups,
    comboDiscount: comboGroups.reduce((sum, g) => sum + g.discount, 0),
  };
}

import type { Order, OrderItem } from '@prisma/client';
import type { OrderDTO, OrderItemDTO, ComboGroupDTO } from '@elaraa/shared';

type OrderWithItems = Order & { items: OrderItem[] };

function buildComboGroups(items: OrderItem[]): ComboGroupDTO[] {
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
    group.originalTotal += Number(item.lineTotal);
    group.itemIds.push(item.id);
  }
  for (const group of groups.values()) {
    group.discount = Math.max(0, group.originalTotal - group.comboPrice);
  }
  return [...groups.values()];
}

export function toOrderDTO(order: OrderWithItems): OrderDTO {
  const items: OrderItemDTO[] = order.items.map((i) => ({
    id: i.id,
    productName: i.productName,
    variantLabel: i.variantLabel,
    sku: i.sku,
    imageUrl: i.imageUrl,
    unitPrice: Number(i.unitPrice),
    quantity: i.quantity,
    lineTotal: Number(i.lineTotal),
    comboGroupId: i.comboGroupId || null,
    comboGroupName: i.comboGroupName,
  }));

  const comboGroups = buildComboGroups(order.items);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shipFullName: order.shipFullName,
    shipLine1: order.shipLine1,
    shipLine2: order.shipLine2,
    shipCity: order.shipCity,
    shipState: order.shipState,
    shipPostalCode: order.shipPostalCode,
    shipCountry: order.shipCountry,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    giftPackaging: order.giftPackaging,
    giftPackagingFee: Number(order.giftPackagingFee),
    comboDiscount: comboGroups.reduce((sum, g) => sum + g.discount, 0),
    comboGroups,
    totalAmount: Number(order.totalAmount),
    items,
    placedAt: order.placedAt.toISOString(),
  };
}

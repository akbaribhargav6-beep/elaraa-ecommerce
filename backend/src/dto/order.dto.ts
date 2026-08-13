import type { Order, OrderItem } from '@prisma/client';
import type { OrderDTO, OrderItemDTO } from '@elaraa/shared';

type OrderWithItems = Order & { items: OrderItem[] };

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
  }));

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
    totalAmount: Number(order.totalAmount),
    items,
    placedAt: order.placedAt.toISOString(),
  };
}

import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';
import { generateOrderNumber } from '../utils/orderNumber';
import { getPaymentProvider } from './payment';
import { toOrderDTO } from '../dto/order.dto';
import { sendMail } from '../config/mailer';
import { orderConfirmationTemplate, adminNewOrderTemplate } from '../utils/emailTemplates';
import { env, primaryClientUrl } from '../config/env';
import { couponService } from './coupon.service';
import { getGiftPackagingFee } from './settings.service';
import { createInvoiceFromOrderInTx } from './invoice.service';
import type { CartIdentity } from './cart.service';

const FREE_SHIPPING_THRESHOLD = 2000;
const FLAT_SHIPPING_FEE = 99;
const GST_RATE = 0.03; // 3% GST on gold jewellery in India

// Sums (individual price total − combo price) across each distinct combo
// group present in the cart — mirrors dto/order.dto.ts's buildComboGroups,
// but runs pre-checkout against raw CartItem rows so it can feed totalAmount
// before the Order/OrderItem rows exist.
function computeComboDiscount(
  items: { comboGroupId: string; comboGroupPrice: unknown; priceSnapshot: unknown; quantity: number }[]
): number {
  const totals = new Map<string, { original: number; comboPrice: number }>();
  for (const item of items) {
    if (!item.comboGroupId) continue;
    const entry = totals.get(item.comboGroupId) ?? { original: 0, comboPrice: Number(item.comboGroupPrice ?? 0) };
    entry.original += Number(item.priceSnapshot) * item.quantity;
    totals.set(item.comboGroupId, entry);
  }
  let discount = 0;
  for (const { original, comboPrice } of totals.values()) {
    discount += Math.max(0, original - comboPrice);
  }
  return discount;
}

interface CheckoutInput {
  customerEmail: string;
  customerPhone: string;
  shippingAddressId?: string;
  shipFullName?: string;
  shipLine1?: string;
  shipLine2?: string;
  shipCity?: string;
  shipState?: string;
  shipPostalCode?: string;
  shipCountry: string;
  paymentMethod: 'COD';
  notes?: string;
  couponCode?: string;
  giftPackaging?: boolean;
}

async function resolveShippingSnapshot(userId: string | undefined, input: CheckoutInput) {
  if (input.shippingAddressId) {
    if (!userId) throw ApiError.badRequest('Saved addresses require an account');
    const address = await prisma.address.findUnique({ where: { id: input.shippingAddressId } });
    if (!address || address.userId !== userId) throw ApiError.notFound('Shipping address not found');
    return {
      shippingAddressId: address.id,
      shipFullName: address.fullName,
      shipLine1: address.line1,
      shipLine2: address.line2,
      shipCity: address.city,
      shipState: address.state,
      shipPostalCode: address.postalCode,
      shipCountry: address.country,
    };
  }

  return {
    shippingAddressId: null,
    shipFullName: input.shipFullName!,
    shipLine1: input.shipLine1!,
    shipLine2: input.shipLine2 ?? null,
    shipCity: input.shipCity!,
    shipState: input.shipState!,
    shipPostalCode: input.shipPostalCode!,
    shipCountry: input.shipCountry,
  };
}

async function checkout(identity: CartIdentity, input: CheckoutInput) {
  const cartRow = identity.userId
    ? await prisma.cart.findUnique({ where: { userId: identity.userId } })
    : await prisma.cart.findUnique({ where: { sessionToken: identity.sessionToken } });

  if (!cartRow) throw ApiError.badRequest('Your cart is empty');

  const items = await prisma.cartItem.findMany({
    where: { cartId: cartRow.id },
    include: { product: true, variant: true },
  });
  if (items.length === 0) throw ApiError.badRequest('Your cart is empty');

  // Verify stock before committing to anything — combo items are now real
  // products/variants too, so they're checked (and later decremented)
  // exactly like any other line.
  for (const item of items) {
    if (!item.variant.isActive || item.variant.stockQuantity < item.quantity) {
      throw ApiError.badRequest(
        `"${item.product.name}" (${[item.variant.metalLabel, item.variant.size].filter(Boolean).join(', ')}) only has ${item.variant.stockQuantity} left in stock`
      );
    }
  }

  const shipping = await resolveShippingSnapshot(identity.userId, input);

  // Each OrderItem snapshots its own image so admin/invoice views don't need
  // a live join back to a product that may later change its photos.
  const primaryImages = await prisma.productImage.findMany({
    where: { productId: { in: [...new Set(items.map((i) => i.productId))] }, isPrimary: true },
    select: { productId: true, url: true },
  });
  const imageByProduct = new Map(primaryImages.map((img) => [img.productId, img.url]));

  const subtotal = items.reduce((sum, i) => sum + Number(i.priceSnapshot) * i.quantity, 0);
  const comboDiscount = computeComboDiscount(items);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const taxAmount = Math.round(subtotal * GST_RATE * 100) / 100;

  let discountAmount = 0;
  let couponId: string | undefined;
  if (input.couponCode) {
    const result = await couponService.validate(input.couponCode, subtotal);
    if (!result.valid || !result.couponId) throw ApiError.badRequest(result.message);

    // validate() only enforces the coupon's global usageLimit — the
    // per-user cap can only be checked here, against this specific user's
    // CouponUsage history.
    if (identity.userId && result.usageLimitPerUser != null) {
      const usedByUser = await prisma.couponUsage.count({
        where: { couponId: result.couponId, userId: identity.userId },
      });
      if (usedByUser >= result.usageLimitPerUser) {
        throw ApiError.badRequest('You have already used this coupon the maximum number of times.');
      }
    }

    discountAmount = result.discountAmount ?? 0;
    couponId = result.couponId;
  }

  // Snapshot the fee actually charged at checkout time — computed from the
  // admin-configurable setting, not trusted from the client, so a customer
  // can't manipulate the request body to pay less (or nothing) for it.
  const giftPackaging = input.giftPackaging === true;
  const giftPackagingFee = giftPackaging ? await getGiftPackagingFee() : 0;

  const totalAmount = subtotal + shippingFee + taxAmount + giftPackagingFee - discountAmount - comboDiscount;

  const orderNumber = generateOrderNumber();
  const provider = getPaymentProvider(input.paymentMethod);
  const { paymentStatus } = await provider.initiate({ orderNumber, amount: totalAmount, customerEmail: input.customerEmail });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: identity.userId ?? null,
        status: 'PENDING',
        paymentMethod: input.paymentMethod,
        paymentStatus,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        shippingAddressId: shipping.shippingAddressId,
        shipFullName: shipping.shipFullName,
        shipLine1: shipping.shipLine1,
        shipLine2: shipping.shipLine2,
        shipCity: shipping.shipCity,
        shipState: shipping.shipState,
        shipPostalCode: shipping.shipPostalCode,
        shipCountry: shipping.shipCountry,
        subtotal,
        shippingFee,
        discountAmount,
        taxAmount,
        giftPackaging,
        giftPackagingFee,
        totalAmount,
        couponId: couponId ?? null,
        notes: input.notes,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            productName: i.product.name,
            variantLabel: [i.variant.metalLabel, i.variant.backType, i.variant.size].filter(Boolean).join(' / '),
            sku: i.variant.sku,
            imageUrl: imageByProduct.get(i.productId) ?? null,
            unitPrice: i.priceSnapshot,
            quantity: i.quantity,
            lineTotal: new Prisma.Decimal(i.priceSnapshot).mul(i.quantity),
            comboGroupId: i.comboGroupId,
            comboGroupName: i.comboGroupName,
            comboGroupPrice: i.comboGroupPrice,
          })),
        },
        statusHistory: { create: { status: 'PENDING', note: 'Order placed' } },
      },
      include: { items: true },
    });

    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId,
          changeQty: -item.quantity,
          reason: 'ORDER_PLACED',
          note: `Order ${orderNumber}`,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cartRow.id } });

    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      // CouponUsage requires a userId, so per-user usage history is only
      // recorded for signed-in checkouts — the discount still applies for
      // guests, they just aren't tracked against the per-user limit.
      if (identity.userId) {
        await tx.couponUsage.create({ data: { couponId, userId: identity.userId, orderId: created.id } });
      }
    }

    // Auto-generates the invoice in the same transaction as the order, so
    // numbering and order creation commit together — a checkout that fails
    // never claims an invoice number, and a placed order is never left
    // without one.
    await createInvoiceFromOrderInTx(tx, created);

    return created;
  });

  const dto = toOrderDTO(order);
  await sendMail({
    to: input.customerEmail,
    subject: `Order confirmed — ${orderNumber}`,
    html: orderConfirmationTemplate(shipping.shipFullName, orderNumber, dto.items, dto.totalAmount),
  }).catch((err) => console.error('Failed to send order confirmation email:', err));

  // Best-effort — a notification failure must never block or roll back a
  // placed order, so this runs after checkout has already fully committed.
  sendMail({
    to: env.ADMIN_NOTIFICATION_EMAIL,
    subject: `New order — ${orderNumber} (₹${dto.totalAmount.toLocaleString('en-IN')})`,
    html: adminNewOrderTemplate(
      orderNumber,
      shipping.shipFullName,
      dto.customerEmail,
      dto.customerPhone,
      dto.items,
      dto.totalAmount,
      dto.paymentMethod,
      `${primaryClientUrl}/admin/orders/${orderNumber}`
    ),
  }).catch((err) => console.error('Failed to send admin order notification email:', err));

  return dto;
}

async function getHistory(userId: string, page: number, limit: number) {
  const where = { userId };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { placedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: orders.map(toOrderDTO),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getByOrderNumber(orderNumber: string, userId?: string, guestEmail?: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) throw ApiError.notFound('Order not found');

  const ownedByUser = userId && order.userId === userId;
  const ownedByGuest = !order.userId && guestEmail && order.customerEmail.toLowerCase() === guestEmail.toLowerCase();
  if (!ownedByUser && !ownedByGuest) throw ApiError.forbidden("You don't have access to this order");

  return toOrderDTO(order);
}

// Same ownership rule as getByOrderNumber, but returns just the internal id
// — used by the invoice download route, which needs the id to look up (or
// lazily create) the Invoice without paying for a full items include.
async function resolveOrderAccess(orderNumber: string, userId?: string, guestEmail?: string): Promise<{ id: string }> {
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true, userId: true, customerEmail: true } });
  if (!order) throw ApiError.notFound('Order not found');

  const ownedByUser = userId && order.userId === userId;
  const ownedByGuest = !order.userId && guestEmail && order.customerEmail.toLowerCase() === guestEmail.toLowerCase();
  if (!ownedByUser && !ownedByGuest) throw ApiError.forbidden("You don't have access to this order");

  return { id: order.id };
}

async function cancelOrder(orderNumber: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.userId !== userId) throw ApiError.forbidden("You don't have access to this order");
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw ApiError.badRequest('This order can no longer be cancelled');
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { increment: item.quantity } },
      });
      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId,
          changeQty: item.quantity,
          reason: 'ORDER_CANCELLED',
          note: `Order ${orderNumber} cancelled`,
        },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        statusHistory: { create: { status: 'CANCELLED', note: 'Cancelled by customer' } },
      },
      include: { items: true },
    });
  });

  return toOrderDTO(updated);
}

export const orderService = { checkout, getHistory, getByOrderNumber, resolveOrderAccess, cancelOrder };

import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';
import { toCartDTO } from '../dto/cart.dto';
import type { CartDTO } from '@elaraa/shared';

export interface CartIdentity {
  userId?: string;
  sessionToken?: string;
}

const cartItemInclude = {
  items: { include: { product: true, variant: true }, orderBy: { createdAt: 'asc' as const } },
};

async function getOrCreateCartRow(identity: CartIdentity) {
  if (identity.userId) {
    const existing = await prisma.cart.findUnique({ where: { userId: identity.userId } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId: identity.userId } });
  }

  if (identity.sessionToken) {
    const existing = await prisma.cart.findUnique({ where: { sessionToken: identity.sessionToken } });
    if (existing) return existing;
    return prisma.cart.create({ data: { sessionToken: identity.sessionToken } });
  }

  throw ApiError.badRequest('No cart identity available');
}

async function withPrimaryImages(cart: Awaited<ReturnType<typeof fullCart>>): Promise<CartDTO> {
  const productIds = [...new Set(cart.items.map((i) => i.productId))];
  const images = await prisma.productImage.findMany({
    where: { productId: { in: productIds }, isPrimary: true },
    select: { productId: true, url: true },
  });
  const map = new Map(images.map((img) => [img.productId, img.url]));
  return toCartDTO(cart, map);
}

function fullCart(cartId: string) {
  return prisma.cart.findUniqueOrThrow({ where: { id: cartId }, include: cartItemInclude });
}

async function getCart(identity: CartIdentity): Promise<CartDTO> {
  const row = await getOrCreateCartRow(identity);
  const cart = await fullCart(row.id);
  return withPrimaryImages(cart);
}

interface AddItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

async function addItem(identity: CartIdentity, input: AddItemInput): Promise<CartDTO> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: true },
  });
  if (!variant || variant.productId !== input.productId || !variant.isActive) {
    throw ApiError.badRequest('This product variant is not available');
  }

  const cartRow = await getOrCreateCartRow(identity);
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cartRow.id, variantId: input.variantId } },
  });

  const price = variant.priceOverride ?? variant.product.basePrice;
  const desiredQty = (existingItem?.quantity ?? 0) + input.quantity;
  const clampedQty = Math.min(desiredQty, Math.max(variant.stockQuantity, 1));

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: clampedQty, priceSnapshot: price },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cartRow.id,
        productId: input.productId,
        variantId: input.variantId,
        quantity: Math.min(input.quantity, Math.max(variant.stockQuantity, 1)),
        priceSnapshot: price,
      },
    });
  }

  const cart = await fullCart(cartRow.id);
  return withPrimaryImages(cart);
}

async function updateItem(identity: CartIdentity, itemId: string, quantity: number): Promise<CartDTO> {
  const cartRow = await getOrCreateCartRow(identity);
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cartRow.id) throw ApiError.notFound('Cart item not found');

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: item.variantId } });
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.min(quantity, Math.max(variant.stockQuantity, 1)) },
    });
  }

  const cart = await fullCart(cartRow.id);
  return withPrimaryImages(cart);
}

async function removeItem(identity: CartIdentity, itemId: string): Promise<CartDTO> {
  return updateItem(identity, itemId, 0);
}

async function clearCart(identity: CartIdentity): Promise<CartDTO> {
  const cartRow = await getOrCreateCartRow(identity);
  await prisma.cartItem.deleteMany({ where: { cartId: cartRow.id } });
  const cart = await fullCart(cartRow.id);
  return withPrimaryImages(cart);
}

// Called right after login — folds a guest cart (identified by the
// pre-login sessionToken cookie) into the now-authenticated user's cart,
// combining quantities for variants present in both.
async function mergeGuestIntoUser(userId: string, sessionToken: string): Promise<CartDTO> {
  const guestCart = await prisma.cart.findUnique({ where: { sessionToken }, include: { items: true } });
  const userCartRow = await getOrCreateCartRow({ userId });

  if (guestCart && guestCart.id !== userCartRow.id) {
    for (const guestItem of guestCart.items) {
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCartRow.id, variantId: guestItem.variantId } },
      });
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + guestItem.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCartRow.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
            priceSnapshot: guestItem.priceSnapshot,
          },
        });
      }
    }
    await prisma.cart.delete({ where: { id: guestCart.id } });
  }

  const cart = await fullCart(userCartRow.id);
  return withPrimaryImages(cart);
}

export const cartService = { getCart, addItem, updateItem, removeItem, clearCart, mergeGuestIntoUser };

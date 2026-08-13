import type { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';
import { toCartDTO } from '../dto/cart.dto';
import { getComboSettings } from './settings.service';
import { getOrCreateComboAnchor } from './combo.service';
import type { CartDTO, ComboSelectionItem } from '@elaraa/shared';

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

interface AddComboInput {
  selections: { productId: string; variantId: string }[];
}

// Builds (or rebuilds) the single combo line in this cart. The price is
// always the currently-configured combo price, looked up here rather than
// trusted from the client, so a customer can't submit a manipulated total.
async function addCombo(identity: CartIdentity, input: AddComboInput): Promise<CartDTO> {
  const settings = await getComboSettings();
  if (!settings.enabled) throw ApiError.badRequest('Combo sets are not available right now');

  const selections = input.selections ?? [];
  const uniqueProductIds = new Set(selections.map((s) => s.productId));
  if (uniqueProductIds.size !== selections.length) {
    throw ApiError.badRequest('Each product can only be selected once in a combo');
  }
  if (selections.length < settings.minProducts) {
    throw ApiError.badRequest(`Select at least ${settings.minProducts} products for a combo`);
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: selections.map((s) => s.variantId) } },
    include: { product: true },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const sel of selections) {
    const variant = variantMap.get(sel.variantId);
    if (!variant || variant.productId !== sel.productId || !variant.isActive) {
      throw ApiError.badRequest('One of the selected products is no longer available');
    }
    if (!variant.product.isComboEligible) {
      throw ApiError.badRequest(`"${variant.product.name}" is not eligible for combo selection`);
    }
  }

  const primaryImages = await prisma.productImage.findMany({
    where: { productId: { in: selections.map((s) => s.productId) }, isPrimary: true },
    select: { productId: true, url: true },
  });
  const imageByProduct = new Map(primaryImages.map((i) => [i.productId, i.url]));

  const comboSelection: ComboSelectionItem[] = selections.map((sel) => {
    const variant = variantMap.get(sel.variantId)!;
    return {
      productId: sel.productId,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      variantId: sel.variantId,
      variantLabel: [variant.metalLabel, variant.backType].filter(Boolean).join(' / '),
      imageUrl: imageByProduct.get(sel.productId) ?? null,
    };
  });

  const anchor = await getOrCreateComboAnchor();
  const cartRow = await getOrCreateCartRow(identity);

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cartRow.id, variantId: anchor.variantId } },
  });

  const comboSelectionJson = comboSelection as unknown as Prisma.InputJsonValue;

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: 1, priceSnapshot: settings.price, comboSelection: comboSelectionJson },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cartRow.id,
        productId: anchor.productId,
        variantId: anchor.variantId,
        quantity: 1,
        priceSnapshot: settings.price,
        comboSelection: comboSelectionJson,
      },
    });
  }

  const cart = await fullCart(cartRow.id);
  return withPrimaryImages(cart);
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
            comboSelection: guestItem.comboSelection ?? undefined,
          },
        });
      }
    }
    await prisma.cart.delete({ where: { id: guestCart.id } });
  }

  const cart = await fullCart(userCartRow.id);
  return withPrimaryImages(cart);
}

export const cartService = { getCart, addItem, addCombo, updateItem, removeItem, clearCart, mergeGuestIntoUser };

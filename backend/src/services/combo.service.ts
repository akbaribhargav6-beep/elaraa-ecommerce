import { prisma } from '../config/db';

const COMBO_PRODUCT_SLUG = '__combo_bundle__';
const COMBO_VARIANT_SKU = 'COMBO-BUNDLE';

// A single well-known, hidden Product+Variant pair that every "build your
// own combo" cart/order line anchors to. CartItem/OrderItem require a real
// productId/variantId FK (and CartItem is unique on [cartId, variantId]) —
// reusing that existing shape for combos, instead of adding a parallel set
// of nullable-FK columns across both tables, means the combo line gets all
// the existing cart/order rendering, stock-check plumbing, etc. for free.
// The actual chosen products live in CartItem/OrderItem.comboSelection.
export async function getOrCreateComboAnchor(): Promise<{ productId: string; variantId: string }> {
  let category = await prisma.category.findUnique({ where: { slug: 'combo' } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Combo', slug: 'combo', description: 'Curated combo sets.', isActive: true, sortOrder: 99 },
    });
  }

  let product = await prisma.product.findUnique({
    where: { slug: COMBO_PRODUCT_SLUG },
    include: { variants: true },
  });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Custom Combo Set',
        slug: COMBO_PRODUCT_SLUG,
        categoryId: category.id,
        basePrice: 0,
        // Deliberately hidden — not a real browsable/purchasable product on
        // its own, only ever reached via the combo add-to-cart flow.
        isActive: false,
      },
      include: { variants: true },
    });
  }

  const variant =
    product.variants[0] ??
    (await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: COMBO_VARIANT_SKU,
        metalLabel: 'Combo',
        stockQuantity: 999_999,
        isDefault: true,
        isActive: true,
      },
    }));

  return { productId: product.id, variantId: variant.id };
}

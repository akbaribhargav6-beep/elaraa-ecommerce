import { prisma } from '../config/db';

const GIFT_PACKAGING_FEE_KEY = 'gift_packaging_fee';
const COMBO_ENABLED_KEY = 'combo_enabled';
const COMBO_MIN_PRODUCTS_KEY = 'combo_min_products';
const COMBO_PRICE_KEY = 'combo_price';

// Read-side counterpart to admin/settings.service.ts's generic upsert — kept
// separate because callers here need a specific, typed, defaulted value
// (checkout math and the public settings endpoint), not the raw key/value row.
export async function getGiftPackagingFee(): Promise<number> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: GIFT_PACKAGING_FEE_KEY } });
  const parsed = setting ? Number(setting.value) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export interface ComboSettings {
  enabled: boolean;
  minProducts: number;
  price: number;
}

// Defaults to disabled — an admin must explicitly turn the feature on (and
// set a real price) rather than the combo page silently going live at ₹0
// the moment this code ships.
export async function getComboSettings(): Promise<ComboSettings> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [COMBO_ENABLED_KEY, COMBO_MIN_PRODUCTS_KEY, COMBO_PRICE_KEY] } },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const minProductsRaw = Number(byKey.get(COMBO_MIN_PRODUCTS_KEY));
  const priceRaw = Number(byKey.get(COMBO_PRICE_KEY));

  return {
    enabled: byKey.get(COMBO_ENABLED_KEY) === 'true',
    minProducts: Number.isFinite(minProductsRaw) && minProductsRaw > 0 ? Math.floor(minProductsRaw) : 3,
    price: Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0,
  };
}

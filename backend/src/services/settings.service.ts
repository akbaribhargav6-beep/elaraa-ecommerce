import { prisma } from '../config/db';

const GIFT_PACKAGING_FEE_KEY = 'gift_packaging_fee';

// Read-side counterpart to admin/settings.service.ts's generic upsert — kept
// separate because callers here need a specific, typed, defaulted value
// (checkout math and the public settings endpoint), not the raw key/value row.
export async function getGiftPackagingFee(): Promise<number> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: GIFT_PACKAGING_FEE_KEY } });
  const parsed = setting ? Number(setting.value) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

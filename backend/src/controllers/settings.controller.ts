import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { getGiftPackagingFee, getComboSettings } from '../services/settings.service';

// Public, unauthenticated — only ever returns values safe for a storefront
// visitor to see (nothing from admin/settings.service.ts's raw key/value
// list, which may hold internal-only settings later).
export const getPublicSettings = asyncHandler(async (_req, res) => {
  const [giftPackagingFee, combo] = await Promise.all([getGiftPackagingFee(), getComboSettings()]);
  sendSuccess(res, { giftPackagingFee, combo });
});

import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { wishlistService } from '../services/wishlist.service';

export const list = asyncHandler(async (req, res) => {
  const items = await wishlistService.list(req.user!.id);
  sendSuccess(res, { items });
});

export const add = asyncHandler(async (req, res) => {
  const items = await wishlistService.add(req.user!.id, req.body.productId, req.body.variantId);
  sendCreated(res, { items });
});

export const remove = asyncHandler(async (req, res) => {
  const items = await wishlistService.remove(req.user!.id, req.params.itemId);
  sendSuccess(res, { items });
});

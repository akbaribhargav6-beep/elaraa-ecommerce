import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { adminDiscountService } from '../../services/admin/discount.service';

export const list = asyncHandler(async (_req, res) => {
  const discounts = await adminDiscountService.list();
  sendSuccess(res, { discounts });
});

export const create = asyncHandler(async (req, res) => {
  const discount = await adminDiscountService.create(req.body);
  sendCreated(res, { discount });
});

export const update = asyncHandler(async (req, res) => {
  const discount = await adminDiscountService.update(req.params.id, req.body);
  sendSuccess(res, { discount });
});

export const remove = asyncHandler(async (req, res) => {
  await adminDiscountService.remove(req.params.id);
  sendSuccess(res, { deleted: true });
});

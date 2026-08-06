import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { adminCouponService } from '../../services/admin/coupon.service';

export const list = asyncHandler(async (_req, res) => {
  const coupons = await adminCouponService.list();
  sendSuccess(res, { coupons });
});

export const create = asyncHandler(async (req, res) => {
  const coupon = await adminCouponService.create(req.body);
  sendCreated(res, { coupon });
});

export const update = asyncHandler(async (req, res) => {
  const coupon = await adminCouponService.update(req.params.id, req.body);
  sendSuccess(res, { coupon });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await adminCouponService.remove(req.params.id);
  sendSuccess(res, result);
});

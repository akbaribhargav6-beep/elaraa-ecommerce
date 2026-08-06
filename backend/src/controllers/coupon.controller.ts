import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { couponService } from '../services/coupon.service';

export const validate = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const result = await couponService.validate(code, subtotal);
  sendSuccess(res, result);
});

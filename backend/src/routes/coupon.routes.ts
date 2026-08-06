import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { apiLimiter } from '../middlewares/rateLimit.middleware';
import { validateCouponSchema } from '../validators/coupon.validators';
import * as couponController from '../controllers/coupon.controller';

export const couponRouter = Router();

couponRouter.post('/validate', apiLimiter, validate({ body: validateCouponSchema }), couponController.validate);

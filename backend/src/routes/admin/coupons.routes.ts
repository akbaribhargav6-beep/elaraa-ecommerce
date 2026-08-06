import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { createCouponSchema, updateCouponSchema } from '../../validators/admin/coupon.validators';
import * as adminCouponController from '../../controllers/admin/coupon.controller';

export const adminCouponsRouter = Router();

adminCouponsRouter.get('/', adminCouponController.list);
adminCouponsRouter.post('/', validate({ body: createCouponSchema }), adminCouponController.create);
adminCouponsRouter.patch('/:id', validate({ body: updateCouponSchema }), adminCouponController.update);
adminCouponsRouter.delete('/:id', adminCouponController.remove);

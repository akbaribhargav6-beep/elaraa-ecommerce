import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { createDiscountSchema, updateDiscountSchema } from '../../validators/admin/discount.validators';
import * as adminDiscountController from '../../controllers/admin/discount.controller';

export const adminDiscountsRouter = Router();

adminDiscountsRouter.get('/', adminDiscountController.list);
adminDiscountsRouter.post('/', validate({ body: createDiscountSchema }), adminDiscountController.create);
adminDiscountsRouter.patch('/:id', validate({ body: updateDiscountSchema }), adminDiscountController.update);
adminDiscountsRouter.delete('/:id', adminDiscountController.remove);

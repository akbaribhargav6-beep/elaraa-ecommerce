import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { adminCustomerListQuerySchema } from '../../validators/admin/customer.validators';
import * as adminCustomerController from '../../controllers/admin/customer.controller';

export const adminCustomersRouter = Router();

adminCustomersRouter.get('/', validate({ query: adminCustomerListQuerySchema }), adminCustomerController.list);
adminCustomersRouter.get('/:id', adminCustomerController.getById);

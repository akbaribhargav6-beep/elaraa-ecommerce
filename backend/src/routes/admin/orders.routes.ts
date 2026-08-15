import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { adminOrderListQuerySchema, updateOrderStatusSchema } from '../../validators/admin/order.validators';
import * as adminOrderController from '../../controllers/admin/order.controller';

export const adminOrdersRouter = Router();

adminOrdersRouter.get('/', validate({ query: adminOrderListQuerySchema }), adminOrderController.list);
adminOrdersRouter.get('/:orderNumber', adminOrderController.getByOrderNumber);
adminOrdersRouter.get('/:orderNumber/history', adminOrderController.getStatusHistory);
adminOrdersRouter.get('/:orderNumber/invoice', adminOrderController.downloadInvoice);
adminOrdersRouter.patch('/:orderNumber/status', validate({ body: updateOrderStatusSchema }), adminOrderController.updateStatus);

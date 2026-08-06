import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware';
import { checkoutSchema, orderNumberParamSchema, orderHistoryQuerySchema } from '../validators/order.validators';
import * as orderController from '../controllers/order.controller';

export const orderRouter = Router();

orderRouter.use(optionalAuth);

orderRouter.post('/', validate({ body: checkoutSchema }), orderController.checkout);
orderRouter.get('/', requireAuth, validate({ query: orderHistoryQuerySchema }), orderController.getHistory);
orderRouter.get('/:orderNumber', validate({ params: orderNumberParamSchema }), orderController.getByOrderNumber);
orderRouter.post('/:orderNumber/cancel', requireAuth, validate({ params: orderNumberParamSchema }), orderController.cancelOrder);

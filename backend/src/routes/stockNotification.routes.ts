import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';
import { createStockNotificationSchema } from '../validators/stockNotification.validators';
import * as stockNotificationController from '../controllers/stockNotification.controller';

export const stockNotificationRouter = Router();

stockNotificationRouter.post(
  '/',
  authLimiter,
  validate({ body: createStockNotificationSchema }),
  stockNotificationController.create
);

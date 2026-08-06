import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';
import { subscribeSchema } from '../validators/newsletter.validators';
import * as newsletterController from '../controllers/newsletter.controller';

export const newsletterRouter = Router();

newsletterRouter.post('/subscribe', authLimiter, validate({ body: subscribeSchema }), newsletterController.subscribe);

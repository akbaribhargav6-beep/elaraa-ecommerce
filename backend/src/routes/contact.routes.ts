import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';
import { contactMessageSchema } from '../validators/contact.validators';
import * as contactController from '../controllers/contact.controller';

export const contactRouter = Router();

contactRouter.post('/', authLimiter, validate({ body: contactMessageSchema }), contactController.submit);

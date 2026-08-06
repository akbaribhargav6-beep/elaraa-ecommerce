import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { paginationQuerySchema } from '../../validators/admin/misc.validators';
import * as adminNewsletterController from '../../controllers/admin/newsletter.controller';

export const adminNewsletterRouter = Router();

adminNewsletterRouter.get('/', validate({ query: paginationQuerySchema }), adminNewsletterController.list);

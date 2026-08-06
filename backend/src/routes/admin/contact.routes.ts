import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { contactListQuerySchema, updateContactStatusSchema } from '../../validators/admin/misc.validators';
import * as adminContactController from '../../controllers/admin/contact.controller';

export const adminContactRouter = Router();

adminContactRouter.get('/', validate({ query: contactListQuerySchema }), adminContactController.list);
adminContactRouter.patch('/:id/status', validate({ body: updateContactStatusSchema }), adminContactController.updateStatus);

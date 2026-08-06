import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { addressBodySchema, addressUpdateSchema, addressIdParamSchema } from '../validators/address.validators';
import * as addressController from '../controllers/address.controller';

export const addressRouter = Router();

addressRouter.use(requireAuth);

addressRouter.get('/', addressController.list);
addressRouter.post('/', validate({ body: addressBodySchema }), addressController.create);
addressRouter.patch('/:id', validate({ params: addressIdParamSchema, body: addressUpdateSchema }), addressController.update);
addressRouter.delete('/:id', validate({ params: addressIdParamSchema }), addressController.remove);
addressRouter.patch('/:id/default', validate({ params: addressIdParamSchema }), addressController.setDefault);

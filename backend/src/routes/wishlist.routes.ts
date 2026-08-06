import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { addWishlistItemSchema, wishlistItemParamsSchema } from '../validators/wishlist.validators';
import * as wishlistController from '../controllers/wishlist.controller';

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get('/', wishlistController.list);
wishlistRouter.post('/', validate({ body: addWishlistItemSchema }), wishlistController.add);
wishlistRouter.delete('/:itemId', validate({ params: wishlistItemParamsSchema }), wishlistController.remove);

import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware';
import { addCartItemSchema, updateCartItemSchema, cartItemParamsSchema, addComboSchema } from '../validators/cart.validators';
import * as cartController from '../controllers/cart.controller';

export const cartRouter = Router();

cartRouter.use(optionalAuth);

cartRouter.get('/', cartController.getCart);
cartRouter.post('/items', validate({ body: addCartItemSchema }), cartController.addItem);
cartRouter.post('/combo', validate({ body: addComboSchema }), cartController.addCombo);
cartRouter.patch(
  '/items/:itemId',
  validate({ params: cartItemParamsSchema, body: updateCartItemSchema }),
  cartController.updateItem
);
cartRouter.delete('/items/:itemId', validate({ params: cartItemParamsSchema }), cartController.removeItem);
cartRouter.delete('/', cartController.clearCart);
cartRouter.post('/merge', requireAuth, cartController.mergeCart);

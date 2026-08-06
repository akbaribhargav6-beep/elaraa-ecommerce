import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { productListQuerySchema, slugParamSchema, createReviewSchema } from '../validators/product.validators';
import * as productController from '../controllers/product.controller';

export const productRouter = Router();

productRouter.get('/', validate({ query: productListQuerySchema }), productController.list);
productRouter.get('/:slug', validate({ params: slugParamSchema }), productController.getBySlug);
productRouter.get('/:slug/related', validate({ params: slugParamSchema }), productController.related);
productRouter.get('/:slug/reviews', validate({ params: slugParamSchema }), productController.listReviews);
productRouter.post(
  '/:slug/reviews',
  requireAuth,
  validate({ params: slugParamSchema, body: createReviewSchema }),
  productController.createReview
);

import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';
import {
  adminProductListQuerySchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  updateImageSchema,
} from '../../validators/admin/product.validators';
import * as adminProductController from '../../controllers/admin/product.controller';

export const adminProductsRouter = Router();

adminProductsRouter.get('/', validate({ query: adminProductListQuerySchema }), adminProductController.list);
adminProductsRouter.post('/', validate({ body: createProductSchema }), adminProductController.create);
adminProductsRouter.get('/:id', adminProductController.getById);
adminProductsRouter.patch('/:id', validate({ body: updateProductSchema }), adminProductController.update);
adminProductsRouter.delete('/:id', adminProductController.remove);

adminProductsRouter.post('/:id/variants', validate({ body: createVariantSchema }), adminProductController.addVariant);
adminProductsRouter.patch('/:id/variants/:variantId', validate({ body: updateVariantSchema }), adminProductController.updateVariant);
adminProductsRouter.delete('/:id/variants/:variantId', adminProductController.removeVariant);

adminProductsRouter.post('/:id/images', uploadImage.single('image'), adminProductController.addImage);
adminProductsRouter.patch('/:id/images/:imageId', validate({ body: updateImageSchema }), adminProductController.updateImage);
adminProductsRouter.delete('/:id/images/:imageId', adminProductController.removeImage);

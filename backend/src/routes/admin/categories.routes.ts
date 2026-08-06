import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';
import { createCategorySchema, updateCategorySchema } from '../../validators/admin/category.validators';
import * as adminCategoryController from '../../controllers/admin/category.controller';

export const adminCategoriesRouter = Router();

adminCategoriesRouter.get('/', adminCategoryController.list);
adminCategoriesRouter.post(
  '/',
  uploadImage.single('image'),
  validate({ body: createCategorySchema }),
  adminCategoryController.create
);
adminCategoriesRouter.patch(
  '/:id',
  uploadImage.single('image'),
  validate({ body: updateCategorySchema }),
  adminCategoryController.update
);
adminCategoriesRouter.delete('/:id', adminCategoryController.remove);

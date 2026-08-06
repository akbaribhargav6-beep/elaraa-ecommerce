import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';
import { createBannerSchema, updateBannerSchema } from '../../validators/admin/banner.validators';
import * as adminBannerController from '../../controllers/admin/banner.controller';

export const adminBannersRouter = Router();

adminBannersRouter.get('/', adminBannerController.list);
adminBannersRouter.post('/', uploadImage.single('image'), validate({ body: createBannerSchema }), adminBannerController.create);
adminBannersRouter.patch('/:id', uploadImage.single('image'), validate({ body: updateBannerSchema }), adminBannerController.update);
adminBannersRouter.delete('/:id', adminBannerController.remove);

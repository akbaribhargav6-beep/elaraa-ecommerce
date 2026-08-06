import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { adminReviewListQuerySchema, updateReviewStatusSchema } from '../../validators/admin/review.validators';
import * as adminReviewController from '../../controllers/admin/review.controller';

export const adminReviewsRouter = Router();

adminReviewsRouter.get('/', validate({ query: adminReviewListQuerySchema }), adminReviewController.list);
adminReviewsRouter.patch('/:id/status', validate({ body: updateReviewStatusSchema }), adminReviewController.updateStatus);
adminReviewsRouter.delete('/:id', adminReviewController.remove);

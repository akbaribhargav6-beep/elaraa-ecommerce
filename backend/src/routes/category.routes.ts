import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.list);
categoryRouter.get('/:slug', categoryController.getBySlug);

import { Router } from 'express';
import * as adminDashboardController from '../../controllers/admin/dashboard.controller';

export const adminDashboardRouter = Router();

adminDashboardRouter.get('/', adminDashboardController.getStats);

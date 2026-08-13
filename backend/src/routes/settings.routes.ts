import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';

export const settingsRouter = Router();

settingsRouter.get('/', settingsController.getPublicSettings);

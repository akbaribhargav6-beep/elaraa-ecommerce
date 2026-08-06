import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { upsertSettingSchema } from '../../validators/admin/misc.validators';
import * as adminSettingsController from '../../controllers/admin/settings.controller';

export const adminSettingsRouter = Router();

adminSettingsRouter.get('/', adminSettingsController.list);
adminSettingsRouter.put('/:key', validate({ body: upsertSettingSchema }), adminSettingsController.upsert);

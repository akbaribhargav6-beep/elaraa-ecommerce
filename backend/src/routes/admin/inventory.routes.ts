import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { inventoryListQuerySchema, adjustStockSchema } from '../../validators/admin/inventory.validators';
import * as adminInventoryController from '../../controllers/admin/inventory.controller';

export const adminInventoryRouter = Router();

adminInventoryRouter.get('/', validate({ query: inventoryListQuerySchema }), adminInventoryController.list);
adminInventoryRouter.get('/:variantId/logs', adminInventoryController.getLogs);
adminInventoryRouter.post('/:variantId/adjust', validate({ body: adjustStockSchema }), adminInventoryController.adjustStock);

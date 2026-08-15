import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { uploadImage } from '../../middlewares/upload.middleware';
import { invoiceSettingsSchema } from '../../validators/admin/invoice.validators';
import * as invoiceSettingsController from '../../controllers/admin/invoiceSettings.controller';

export const adminInvoiceSettingsRouter = Router();

adminInvoiceSettingsRouter.get('/', invoiceSettingsController.get);
adminInvoiceSettingsRouter.put(
  '/',
  uploadImage.single('logo'),
  validate({ body: invoiceSettingsSchema }),
  invoiceSettingsController.update
);

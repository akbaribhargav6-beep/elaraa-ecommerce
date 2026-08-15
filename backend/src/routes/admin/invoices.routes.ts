import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { adminInvoiceListQuerySchema, manualInvoiceSchema } from '../../validators/admin/invoice.validators';
import * as adminInvoiceController from '../../controllers/admin/invoice.controller';

export const adminInvoicesRouter = Router();

adminInvoicesRouter.get('/', validate({ query: adminInvoiceListQuerySchema }), adminInvoiceController.list);
adminInvoicesRouter.post('/', validate({ body: manualInvoiceSchema }), adminInvoiceController.createManual);
adminInvoicesRouter.get('/:id', adminInvoiceController.getById);
adminInvoicesRouter.get('/:id/pdf', adminInvoiceController.downloadPdf);
adminInvoicesRouter.patch('/:id', validate({ body: manualInvoiceSchema }), adminInvoiceController.updateManual);
adminInvoicesRouter.post('/:id/finalize', adminInvoiceController.finalize);
adminInvoicesRouter.post('/:id/cancel', adminInvoiceController.cancel);
adminInvoicesRouter.delete('/:id', adminInvoiceController.remove);

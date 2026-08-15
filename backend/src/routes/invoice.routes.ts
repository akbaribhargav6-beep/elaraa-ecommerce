import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';

export const invoiceRouter = Router();

// Public, unauthenticated — see the comment on downloadSharedInvoice.
invoiceRouter.get('/share/:token', invoiceController.downloadSharedInvoice);

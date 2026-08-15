import type { Request, Response } from 'express';
import type { InvoiceStatus, InvoiceType } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { invoiceService } from '../../services/invoice.service';
import { renderInvoicePdf } from '../../services/invoicePdf.service';
import { toInvoiceDTO, toInvoiceListItemDTO } from '../../dto/invoice.dto';

function shareBaseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query as unknown as {
    search?: string;
    status?: InvoiceStatus;
    type?: InvoiceType;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    limit: number;
  };
  const result = await invoiceService.listInvoices(q);
  sendSuccess(res, { ...result, items: result.items.map(toInvoiceListItemDTO) });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  sendSuccess(res, { invoice: toInvoiceDTO(invoice, shareBaseUrl(req)) });
});

export const downloadPdf = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  const buffer = await renderInvoicePdf(invoice);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(buffer);
});

export const createManual = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.createManualInvoice(req.body, req.user!.id);
  sendCreated(res, { invoice: toInvoiceDTO(invoice, shareBaseUrl(req)) });
});

export const updateManual = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.updateManualInvoice(req.params.id, req.body);
  sendSuccess(res, { invoice: toInvoiceDTO(invoice, shareBaseUrl(req)) });
});

export const finalize = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.finalizeInvoice(req.params.id);
  sendSuccess(res, { invoice: toInvoiceDTO(invoice, shareBaseUrl(req)) });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.cancelInvoice(req.params.id);
  sendSuccess(res, { invoice: toInvoiceDTO(invoice, shareBaseUrl(req)) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await invoiceService.deleteInvoice(req.params.id);
  sendSuccess(res, { success: true });
});

import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { orderService } from '../services/order.service';
import { invoiceService } from '../services/invoice.service';
import { renderInvoicePdf } from '../services/invoicePdf.service';

function sendPdf(res: Response, filename: string, buffer: Buffer) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(buffer);
}

// GET /api/orders/:orderNumber/invoice — customer-facing. Same ownership
// rule as viewing the order itself: the logged-in owner, or a guest who
// supplies the matching ?email=.
export const downloadOrderInvoice = asyncHandler(async (req: Request, res: Response) => {
  const guestEmail = typeof req.query.email === 'string' ? req.query.email : undefined;
  const { id: orderId } = await orderService.resolveOrderAccess(req.params.orderNumber, req.user?.id, guestEmail);
  const invoice = await invoiceService.getOrCreateInvoiceForOrder(orderId);
  const buffer = await renderInvoicePdf(invoice);
  sendPdf(res, `${invoice.invoiceNumber}.pdf`, buffer);
});

// GET /api/invoices/share/:token — public, unauthenticated. Backs the "Send
// via WhatsApp" link on manually created invoices — the token is a random,
// unguessable UUID scoped to exactly one invoice, so this never needs (or
// exposes) a login-gated session.
export const downloadSharedInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceByToken(req.params.token);
  if (invoice.status === 'CANCELLED') throw ApiError.notFound('Invoice not found');
  const buffer = await renderInvoicePdf(invoice);
  sendPdf(res, `${invoice.invoiceNumber}.pdf`, buffer);
});

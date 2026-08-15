import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { getInvoiceSettings, updateInvoiceSettings } from '../../services/invoiceSettings.service';
import { toInvoiceSettingsDTO } from '../../dto/invoice.dto';
import { getStorageProvider } from '../../services/storage';

export const get = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getInvoiceSettings();
  sendSuccess(res, { settings: toInvoiceSettingsDTO(settings) });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  let companyLogoUrl: string | undefined;
  if (req.file) {
    const storage = getStorageProvider();
    const ext = req.file.originalname.split('.').pop() ?? 'png';
    const key = `invoice/logo-${Date.now()}.${ext}`;
    companyLogoUrl = (await storage.save(key, req.file.buffer, req.file.mimetype)).url;
  }
  const settings = await updateInvoiceSettings({
    ...req.body,
    ...(companyLogoUrl !== undefined ? { companyLogoUrl } : {}),
  });
  sendSuccess(res, { settings: toInvoiceSettingsDTO(settings) });
});

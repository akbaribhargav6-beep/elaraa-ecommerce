import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminInventoryService } from '../../services/admin/inventory.service';

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as { search?: string; lowStock?: boolean; page: number; limit: number };
  const result = await adminInventoryService.list(q);
  sendSuccess(res, result);
});

export const getLogs = asyncHandler(async (req, res) => {
  const logs = await adminInventoryService.getLogs(req.params.variantId);
  sendSuccess(res, { logs });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const variant = await adminInventoryService.adjustStock(req.params.variantId, req.user!.id, req.body);
  sendSuccess(res, { variant });
});

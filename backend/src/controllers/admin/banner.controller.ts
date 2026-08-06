import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { adminBannerService } from '../../services/admin/banner.service';

export const list = asyncHandler(async (_req, res) => {
  const banners = await adminBannerService.list();
  sendSuccess(res, { banners });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('A banner image is required');
  const banner = await adminBannerService.create(req.body, req.file);
  sendCreated(res, { banner });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const banner = await adminBannerService.update(req.params.id, req.body, req.file);
  sendSuccess(res, { banner });
});

export const remove = asyncHandler(async (req, res) => {
  await adminBannerService.remove(req.params.id);
  sendSuccess(res, { deleted: true });
});

import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { adminCategoryService } from '../../services/admin/category.service';

export const list = asyncHandler(async (_req, res) => {
  const categories = await adminCategoryService.list();
  sendSuccess(res, { categories });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const category = await adminCategoryService.create(req.body, req.file);
  sendCreated(res, { category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await adminCategoryService.update(req.params.id, req.body, req.file);
  sendSuccess(res, { category });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await adminCategoryService.remove(req.params.id);
  sendSuccess(res, result);
});

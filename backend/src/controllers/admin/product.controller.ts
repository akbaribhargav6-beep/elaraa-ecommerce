import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { adminProductService, type AdminProductListParams } from '../../services/admin/product.service';

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as AdminProductListParams;
  const result = await adminProductService.list(q);
  sendSuccess(res, result);
});

export const getById = asyncHandler(async (req, res) => {
  const product = await adminProductService.getById(req.params.id);
  sendSuccess(res, { product });
});

export const create = asyncHandler(async (req, res) => {
  const product = await adminProductService.create(req.body);
  sendCreated(res, { product });
});

export const update = asyncHandler(async (req, res) => {
  const product = await adminProductService.update(req.params.id, req.body);
  sendSuccess(res, { product });
});

export const remove = asyncHandler(async (req, res) => {
  const result = await adminProductService.remove(req.params.id);
  sendSuccess(res, result);
});

export const addVariant = asyncHandler(async (req, res) => {
  const product = await adminProductService.addVariant(req.params.id, req.body);
  sendCreated(res, { product });
});

export const updateVariant = asyncHandler(async (req, res) => {
  const product = await adminProductService.updateVariant(req.params.id, req.params.variantId, req.body);
  sendSuccess(res, { product });
});

export const removeVariant = asyncHandler(async (req, res) => {
  const product = await adminProductService.removeVariant(req.params.id, req.params.variantId);
  sendSuccess(res, { product });
});

export const addImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');
  const image = await adminProductService.addImage(req.params.id, req.file);
  sendCreated(res, { image });
});

export const updateImage = asyncHandler(async (req, res) => {
  const image = await adminProductService.updateImage(req.params.id, req.params.imageId, req.body);
  sendSuccess(res, { image });
});

export const removeImage = asyncHandler(async (req, res) => {
  await adminProductService.removeImage(req.params.id, req.params.imageId);
  sendSuccess(res, { deleted: true });
});

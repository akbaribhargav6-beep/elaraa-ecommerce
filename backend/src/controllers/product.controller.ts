import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { productService } from '../services/product.service';
import type { ProductListParams } from '../services/product.service';

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as ProductListParams;
  const result = await productService.list(q);
  sendSuccess(res, result);
});

export const getBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getBySlug(req.params.slug);
  sendSuccess(res, { product });
});

export const related = asyncHandler(async (req, res) => {
  const products = await productService.related(req.params.slug);
  sendSuccess(res, { products });
});

export const listReviews = asyncHandler(async (req, res) => {
  const reviews = await productService.listReviews(req.params.slug);
  sendSuccess(res, { reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const reviews = await productService.createReview(req.params.slug, req.user!.id, req.body);
  sendCreated(res, { reviews });
});

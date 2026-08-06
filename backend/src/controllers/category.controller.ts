import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { categoryService } from '../services/category.service';

export const list = asyncHandler(async (_req, res) => {
  const categories = await categoryService.list();
  sendSuccess(res, { categories });
});

export const getBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getBySlug(req.params.slug);
  sendSuccess(res, { category });
});

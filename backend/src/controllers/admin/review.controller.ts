import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminReviewService } from '../../services/admin/review.service';
import type { ReviewStatus } from '@prisma/client';

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as { status?: ReviewStatus; page: number; limit: number };
  const result = await adminReviewService.list(q);
  sendSuccess(res, result);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const result = await adminReviewService.updateStatus(req.params.id, req.body.status);
  sendSuccess(res, result);
});

export const remove = asyncHandler(async (req, res) => {
  await adminReviewService.remove(req.params.id);
  sendSuccess(res, { deleted: true });
});

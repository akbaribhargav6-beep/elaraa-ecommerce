import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminNewsletterService } from '../../services/admin/newsletter.service';

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as { page: number; limit: number };
  const result = await adminNewsletterService.list(q);
  sendSuccess(res, result);
});

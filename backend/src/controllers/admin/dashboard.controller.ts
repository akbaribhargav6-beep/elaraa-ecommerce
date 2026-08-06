import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminDashboardService } from '../../services/admin/dashboard.service';

export const getStats = asyncHandler(async (_req, res) => {
  const stats = await adminDashboardService.getStats();
  sendSuccess(res, stats);
});

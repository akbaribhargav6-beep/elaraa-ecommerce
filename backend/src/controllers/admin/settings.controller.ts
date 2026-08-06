import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminSettingsService } from '../../services/admin/settings.service';

export const list = asyncHandler(async (_req, res) => {
  const settings = await adminSettingsService.list();
  sendSuccess(res, { settings });
});

export const upsert = asyncHandler(async (req, res) => {
  const setting = await adminSettingsService.upsert(req.params.key, req.body.value, req.body.group);
  sendSuccess(res, { setting });
});

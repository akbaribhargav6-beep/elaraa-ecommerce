import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminContactService } from '../../services/admin/contact.service';
import type { ContactMessageStatus } from '@prisma/client';

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as { status?: ContactMessageStatus; page: number; limit: number };
  const result = await adminContactService.list(q);
  sendSuccess(res, result);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const message = await adminContactService.updateStatus(req.params.id, req.body.status);
  sendSuccess(res, { message });
});

import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminCustomerService } from '../../services/admin/customer.service';

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as { search?: string; page: number; limit: number };
  const result = await adminCustomerService.list(q);
  sendSuccess(res, result);
});

export const getById = asyncHandler(async (req, res) => {
  const customer = await adminCustomerService.getById(req.params.id);
  sendSuccess(res, { customer });
});

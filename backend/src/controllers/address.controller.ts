import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { addressService } from '../services/address.service';

export const list = asyncHandler(async (req, res) => {
  const addresses = await addressService.list(req.user!.id);
  sendSuccess(res, { addresses });
});

export const create = asyncHandler(async (req, res) => {
  const address = await addressService.create(req.user!.id, req.body);
  sendCreated(res, { address });
});

export const update = asyncHandler(async (req, res) => {
  const address = await addressService.update(req.user!.id, req.params.id, req.body);
  sendSuccess(res, { address });
});

export const remove = asyncHandler(async (req, res) => {
  await addressService.remove(req.user!.id, req.params.id);
  sendSuccess(res, { deleted: true });
});

export const setDefault = asyncHandler(async (req, res) => {
  const address = await addressService.setDefault(req.user!.id, req.params.id);
  sendSuccess(res, { address });
});

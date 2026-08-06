import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminOrderService } from '../../services/admin/order.service';
import type { OrderStatus } from '@prisma/client';

export const list = asyncHandler(async (req, res) => {
  const q = req.query as unknown as { search?: string; status?: OrderStatus; page: number; limit: number };
  const result = await adminOrderService.list(q);
  sendSuccess(res, result);
});

export const getByOrderNumber = asyncHandler(async (req, res) => {
  const order = await adminOrderService.getByOrderNumber(req.params.orderNumber);
  sendSuccess(res, { order });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await adminOrderService.updateStatus(req.params.orderNumber, req.user!.id, req.body);
  sendSuccess(res, { order });
});

export const getStatusHistory = asyncHandler(async (req, res) => {
  const history = await adminOrderService.getStatusHistory(req.params.orderNumber);
  sendSuccess(res, { history });
});

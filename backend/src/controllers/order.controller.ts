import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { orderService } from '../services/order.service';

const GUEST_CART_COOKIE = 'cartSessionToken';
const GUEST_CART_HEADER = 'x-cart-token';

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  // Must match cart.controller.ts's resolveIdentity exactly — the header
  // takes priority there (see the comment on that function for why: the
  // guest cart cookie is third-party in production and gets blocked by
  // Safari/Firefox-strict/Brave). Checking the cookie only here meant a
  // guest whose cart resolved via the header the whole time would hit
  // "Your cart is empty" the moment they tried to actually place the order.
  const headerToken = req.headers[GUEST_CART_HEADER];
  const sessionToken =
    (typeof headerToken === 'string' && headerToken) || (req.cookies?.[GUEST_CART_COOKIE] as string | undefined);

  const identity = req.user ? { userId: req.user.id } : { sessionToken };

  if (!identity.userId && !identity.sessionToken) {
    throw ApiError.badRequest('Your cart is empty');
  }

  const order = await orderService.checkout(identity, req.body);
  if (!req.user) res.clearCookie(GUEST_CART_COOKIE, { path: '/' });
  sendCreated(res, { order });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const result = await orderService.getHistory(req.user!.id, page, limit);
  sendSuccess(res, result);
});

export const getByOrderNumber = asyncHandler(async (req: Request, res: Response) => {
  const guestEmail = typeof req.query.email === 'string' ? req.query.email : undefined;
  const order = await orderService.getByOrderNumber(req.params.orderNumber, req.user?.id, guestEmail);
  sendSuccess(res, { order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.cancelOrder(req.params.orderNumber, req.user!.id);
  sendSuccess(res, { order });
});

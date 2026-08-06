import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { cartService, type CartIdentity } from '../services/cart.service';
import { isProd } from '../config/env';

const GUEST_CART_COOKIE = 'cartSessionToken';
const GUEST_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  // See the matching comment in auth.controller.ts — cross-domain
  // frontend/backend in production requires SameSite=None (+Secure).
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
};

// Resolves the current request to a cart identity: the logged-in user's cart
// if authenticated, otherwise a guest cart keyed by a cookie — minting a new
// guest session token and setting the cookie if one isn't present yet.
function resolveIdentity(req: Request, res: Response): CartIdentity {
  if (req.user) return { userId: req.user.id };

  let token = req.cookies?.[GUEST_CART_COOKIE];
  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie(GUEST_CART_COOKIE, token, GUEST_COOKIE_OPTS);
  }
  return { sessionToken: token };
}

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(resolveIdentity(req, res));
  sendSuccess(res, { cart });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.addItem(resolveIdentity(req, res), req.body);
  sendSuccess(res, { cart });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.updateItem(resolveIdentity(req, res), req.params.itemId, req.body.quantity);
  sendSuccess(res, { cart });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.removeItem(resolveIdentity(req, res), req.params.itemId);
  sendSuccess(res, { cart });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.clearCart(resolveIdentity(req, res));
  sendSuccess(res, { cart });
});

export const mergeCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized('Must be logged in to merge carts');
  const token = req.cookies?.[GUEST_CART_COOKIE];
  if (!token) {
    const cart = await cartService.getCart({ userId: req.user.id });
    return sendSuccess(res, { cart });
  }

  const cart = await cartService.mergeGuestIntoUser(req.user.id, token);
  res.clearCookie(GUEST_CART_COOKIE, { path: '/' });
  sendSuccess(res, { cart });
});

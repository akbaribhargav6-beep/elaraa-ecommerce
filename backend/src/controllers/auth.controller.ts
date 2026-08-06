import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { authService } from '../services/auth.service';
import { isProd } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  // Frontend (Vercel) and backend (Railway) live on different registrable
  // domains in production, so the cookie must be SameSite=None to survive a
  // cross-site fetch — Lax only works locally because localhost:3000 and
  // localhost:4000 count as the same site (SameSite ignores port). None
  // requires Secure, hence tying both to isProd together.
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

function requestMeta(req: Request) {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  sendCreated(res, { user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login({ ...req.body, ...requestMeta(req) });
  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
  sendSuccess(res, { user, accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');

  const { user, accessToken, refreshToken } = await authService.refresh(token, requestMeta(req));
  res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
  sendSuccess(res, { user, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  sendSuccess(res, { loggedOut: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Always return success — do not reveal whether the email exists.
  sendSuccess(res, { message: 'If that email is registered, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, { message: 'Password updated. Please log in again.' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  sendSuccess(res, { message: 'Email verified.' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.body.email);
  sendSuccess(res, { message: 'If that account needs verification, a new email has been sent.' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getById(req.user!.id);
  sendSuccess(res, { user });
});

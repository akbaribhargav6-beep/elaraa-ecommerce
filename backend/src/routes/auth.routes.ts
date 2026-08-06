import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from '../validators/auth.validators';
import * as authController from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
authRouter.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
authRouter.get('/verify-email/:token', authController.verifyEmail);
authRouter.post(
  '/resend-verification',
  authLimiter,
  validate({ body: resendVerificationSchema }),
  authController.resendVerification
);
authRouter.get('/me', requireAuth, authController.me);

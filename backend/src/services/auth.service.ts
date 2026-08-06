import crypto from 'node:crypto';
import { prisma } from '../config/db';
import { ApiError } from '../utils/apiError';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, generateRefreshToken, hashToken, refreshTokenExpiryDate } from '../utils/jwt';
import { sendMail } from '../config/mailer';
import { env } from '../config/env';
import { verifyEmailTemplate, resetPasswordTemplate } from '../utils/emailTemplates';
import type { User } from '@prisma/client';

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(input.password);
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      emailVerifyToken,
      emailVerifyExpires: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    },
  });

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${emailVerifyToken}`;
  // Not awaited — a slow or unreachable SMTP path must never block the
  // user-facing register response (email verification is soft anyway; see
  // README). Matches the fire-and-forget pattern in order.service.ts.
  sendMail({
    to: user.email,
    subject: 'Verify your ELARAA account',
    html: verifyEmailTemplate(user.firstName, verifyUrl),
  }).catch((err) => console.error('Failed to send verification email:', err));

  return toPublicUser(user);
}

interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

async function issueTokenPair(user: User, meta: { userAgent?: string; ipAddress?: string }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const rawRefreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: refreshTokenExpiryDate(),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const tokens = await issueTokenPair(user, input);
  return { user: toPublicUser(user), ...tokens };
}

async function refresh(rawRefreshToken: string, meta: { userAgent?: string; ipAddress?: string }) {
  const tokenHash = hashToken(rawRefreshToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  // Rotate: revoke the old token, issue a brand new pair.
  const tokens = await issueTokenPair(existing.user, meta);
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedByToken: hashToken(tokens.refreshToken) },
  });

  return { user: toPublicUser(existing.user), ...tokens };
}

async function logout(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Deliberately silent if the user doesn't exist — don't leak which emails are registered.
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
  sendMail({
    to: user.email,
    subject: 'Reset your ELARAA password',
    html: resetPasswordTemplate(user.firstName, resetUrl),
  }).catch((err) => console.error('Failed to send reset email:', err));
}

async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw ApiError.badRequest('This reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpires: null },
    }),
    // Invalidate all existing sessions on password change.
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

async function verifyEmail(token: string) {
  const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });
  if (!user || !user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
    throw ApiError.badRequest('This verification link is invalid or has expired');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
  });
}

async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isEmailVerified) return; // silent no-op either way

  const emailVerifyToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken, emailVerifyExpires: new Date(Date.now() + EMAIL_VERIFY_TTL_MS) },
  });

  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${emailVerifyToken}`;
  sendMail({
    to: user.email,
    subject: 'Verify your ELARAA account',
    html: verifyEmailTemplate(user.firstName, verifyUrl),
  }).catch((err) => console.error('Failed to send verification email:', err));
}

async function getById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  return toPublicUser(user);
}

export const authService = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getById,
  toPublicUser,
};

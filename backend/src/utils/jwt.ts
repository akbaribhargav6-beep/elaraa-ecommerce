import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env';
import type { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // userId
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

// Refresh tokens are opaque random strings (not JWTs) — the raw value goes to
// the client as an httpOnly cookie, only its SHA-256 hash is stored in the DB
// (RefreshToken.tokenHash). This lets us revoke/rotate individual sessions by
// DB lookup without needing a JWT blocklist.
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiryDate(): Date {
  const days = parseInt(env.JWT_REFRESH_EXPIRES_IN.replace(/\D/g, ''), 10) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // HTTP-API email provider — used in preference to SMTP when set. Needed
  // because most PaaS hosts (Railway included) block outbound SMTP ports
  // entirely, so a real SMTP_HOST/PORT/USER/PASS still can't deliver mail
  // there; Resend's API goes over plain HTTPS instead.
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('ELARAA <no-reply@elaraa.example>'),
  ADMIN_NOTIFICATION_EMAIL: z.string().default('elaraaluxes@gmail.com'),

  UPLOAD_DIR: z.string().default('uploads'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables — check backend/.env against .env.example');
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

// CLIENT_URL may hold a comma-separated list of allowed origins (e.g. the
// production custom domain plus a Vercel URL kept as a fallback during
// cutover). Anything that needs one canonical frontend URL — building links
// in emails — should use the first entry, not the raw env var.
export const clientOrigins = env.CLIENT_URL.split(',').map((origin) => origin.trim());
export const primaryClientUrl = clientOrigins[0];

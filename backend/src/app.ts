import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'node:path';
import { env, isProd } from './config/env';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimit.middleware';
import { apiRouter } from './routes';

export const app = express();

// Railway (like most PaaS) terminates TLS at a single edge proxy in front of
// the app and forwards the real client IP via X-Forwarded-For. Without this,
// express-rate-limit throws on every request (it refuses to trust that
// header by default) — trusting exactly one hop is the correct, safe setting
// here, not `true` (which would trust the entire chain and allow IP
// spoofing via a client-supplied header).
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(isProd ? 'combined' : 'dev'));

// Static uploads (local storage provider serves files from here)
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api', apiLimiter, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

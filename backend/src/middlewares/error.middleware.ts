import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { isProd } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: isProd ? 'Internal server error' : err instanceof Error ? err.message : 'Internal server error',
  });
}

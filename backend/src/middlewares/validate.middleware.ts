import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/apiError';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

// Validates and reassigns req.body/query/params from parsed (and thus
// type-coerced/defaulted) zod output, so downstream handlers get clean data.
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.body = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      } else {
        req.body = result.data;
      }
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.query = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      } else {
        req.query = result.data as typeof req.query;
      }
    }
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.params = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      } else {
        req.params = result.data as typeof req.params;
      }
    }

    if (Object.keys(errors).length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }
    next();
  };
}

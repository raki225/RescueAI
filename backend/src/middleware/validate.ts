import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { AppError } from '../utils/AppError';

type Target = 'body' | 'query' | 'params';

/**
 * Validate a request segment against a Joi schema.
 * Strips unknown keys and returns a 400 with details on failure.
 */
export const validate =
  (schema: ObjectSchema, target: Target = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      next(AppError.badRequest('Validation failed', details));
      return;
    }

    req[target] = value;
    next();
  };

export default validate;

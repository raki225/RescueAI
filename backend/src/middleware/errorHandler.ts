import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { config } from '../config/env';

/** Central Express error handler. Must have four arguments. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isApp = err instanceof AppError;
  const statusCode = isApp ? err.statusCode : 500;

  if (!isApp || statusCode >= 500) {
    logger.error(err.stack ?? err.message);
  } else {
    logger.warn(`${statusCode} ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      ...(isApp && err.details ? { details: err.details } : {}),
      ...(config.isProd ? {} : { stack: err.stack }),
    },
  });
};

export default errorHandler;

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/** Lightweight request logger with response time and status. */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
};

export default requestLogger;

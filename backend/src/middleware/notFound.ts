import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/** 404 handler for unmatched routes. */
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;

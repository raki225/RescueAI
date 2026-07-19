import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * Global API rate limiter. Protects the (potentially expensive) AI endpoints.
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later.' },
  },
});

export default rateLimiter;

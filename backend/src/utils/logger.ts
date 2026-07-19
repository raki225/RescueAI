import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}] ${stack ?? message}`;
});

/**
 * Application-wide Winston logger.
 * Human-readable colorized output in development.
 */
export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.isProd ? winston.format.json() : combine(colorize(), devFormat)
  ),
  transports: [new winston.transports.Console()],
});

export default logger;

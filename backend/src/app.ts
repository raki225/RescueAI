import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { healthCheck } from './controllers/healthController';
import apiV1 from './routes';

/**
 * Build and configure the Express application (no listening here — see server.ts).
 */
export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.clientOrigin,
      methods: ['GET', 'POST'],
    })
  );
  app.use(compression());
  // Large limit to accommodate base64 image uploads.
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get('/health', healthCheck);
  app.get('/', (_req: Request, res: Response) => {
    res.json({ success: true, service: 'RescueAI API', docs: '/api/v1' });
  });

  app.use('/api/v1', rateLimiter, apiV1);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;

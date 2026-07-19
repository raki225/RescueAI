import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { seedHospitals } from './data/seed';
import { logger } from './utils/logger';

const start = async (): Promise<void> => {
  try {
    await connectDatabase();
    await seedHospitals(false);

    const app = createApp();
    const server = app.listen(config.port, config.host, () => {
      logger.info('──────────────────────────────────────────────');
      logger.info(`  RescueAI API running at http://${config.host}:${config.port}`);
      logger.info(`  Environment : ${config.nodeEnv}`);
      logger.info(`  AI mode     : ${config.gemini.enabled ? 'Gemini (' + config.gemini.model + ')' : 'Rule-based fallback'}`);
      logger.info(`  Client CORS : ${config.clientOrigin}`);
      logger.info('──────────────────────────────────────────────');
    });

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received — shutting down gracefully.`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    logger.error(`Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }
};

void start();

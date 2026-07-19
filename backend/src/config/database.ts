import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

let isConnected = false;

/**
 * Establish a MongoDB connection using Mongoose.
 * Idempotent — safe to call multiple times.
 */
export const connectDatabase = async (): Promise<typeof mongoose> => {
  if (isConnected) return mongoose;

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 8000,
  });

  return mongoose;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
};

export default connectDatabase;

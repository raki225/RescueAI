import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Centralized, typed application configuration.
 * Reads from environment with safe local-development defaults.
 */
export interface AppConfig {
  nodeEnv: string;
  isProd: boolean;
  port: number;
  host: string;
  clientOrigin: string;
  mongoUri: string;
  gemini: {
    apiKey: string;
    model: string;
    enabled: boolean;
  };
  googleMaps: {
    apiKey: string;
    enabled: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logLevel: string;
}

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const geminiApiKey = (process.env.GEMINI_API_KEY ?? '').trim();
const googleMapsApiKey = (process.env.GOOGLE_MAPS_API_KEY ?? '').trim();

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  port: toInt(process.env.PORT, 4000),
  host: process.env.HOST ?? '127.0.0.1',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5180',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/rescueai',
  gemini: {
    apiKey: geminiApiKey,
    model: process.env.GEMINI_MODEL ?? 'gemini-flash-latest',
    enabled: geminiApiKey.length > 0,
  },
  googleMaps: {
    apiKey: googleMapsApiKey,
    enabled: googleMapsApiKey.length > 0,
  },
  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 100),
  },
  logLevel: process.env.LOG_LEVEL ?? 'info',
};

export default config;

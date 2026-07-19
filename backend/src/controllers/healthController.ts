import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { isGeminiEnabled } from '../services/ai/geminiService';

/** GET /health — liveness + dependency status. */
export const healthCheck = (_req: Request, res: Response): void => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.json({
    success: true,
    status: 'ok',
    service: 'RescueAI API',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: dbState === 1 ? 'connected' : 'disconnected',
      ai: isGeminiEnabled() ? 'gemini' : 'rule-based-fallback',
    },
  });
};

export default healthCheck;

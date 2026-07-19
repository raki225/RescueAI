import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { generateSessionId } from '../utils/helpers';
import { runAssessment, getFollowUpQuestions } from '../services/triage/assessmentService';
import { TriageSessionModel } from '../models/TriageSession';
import { ImageCategory, TriageInput } from '../types';

/**
 * POST /api/v1/triage/questions
 * Stage 1 — detect the category from text/image and return adaptive follow-up
 * questions. When an image is included it is analysed here (quality + findings).
 */
export const getQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { text, image, imageCategory } = req.body as {
    text?: string;
    image?: string;
    imageCategory?: ImageCategory;
  };

  if (!text?.trim() && !image) {
    throw AppError.badRequest('Please provide a symptom description or an image.');
  }

  const result = await getFollowUpQuestions({ text, image, imageCategory });
  res.json({ success: true, data: result });
});

/**
 * POST /api/v1/triage/analyze
 * Stage 2 — combine image findings, symptoms and follow-up answers into a
 * risk-scored assessment, then persist the session.
 */
export const analyzeTriage = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as TriageInput & {
    imageAnalysis?: unknown;
    location?: { lat: number; lng: number; address?: string };
  };

  if (!body.text?.trim() && !body.image && !body.imageAnalysis && !body.answers?.length) {
    throw AppError.badRequest('Please provide symptoms, an image, or answers to assess.');
  }

  const { analysis, imageAnalysis } = await runAssessment(body);
  const sessionId = generateSessionId();

  const session = await TriageSessionModel.create({
    sessionId,
    symptoms: {
      text: body.text ?? '',
      hasImage: Boolean(body.image || body.imageAnalysis),
      category: analysis.detectedCategory ?? '',
      imageCategory: imageAnalysis?.category ?? body.imageCategory ?? '',
      answers: body.answers ?? [],
    },
    analysis,
    userLocation: body.location
      ? { lat: body.location.lat, lng: body.location.lng, address: body.location.address ?? '' }
      : undefined,
    status: 'analyzed',
  });

  res.status(201).json({
    success: true,
    data: {
      sessionId: session.sessionId,
      analysis,
      imageAnalysis,
      createdAt: session.createdAt,
    },
  });
});

/**
 * GET /api/v1/triage/:sessionId
 * Retrieves a previously analysed session.
 */
export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await TriageSessionModel.findOne({ sessionId: req.params.sessionId }).lean();
  if (!session) throw AppError.notFound('Triage session not found');
  res.json({ success: true, data: session });
});

export default { getQuestions, analyzeTriage, getSession };

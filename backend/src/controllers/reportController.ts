import { Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { TriageSessionModel } from '../models/TriageSession';
import { EmergencyReportModel } from '../models/EmergencyReport';

const buildReportId = (): string => `RPT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

/**
 * POST /api/v1/reports
 * Generates a shareable emergency report from an analysed triage session.
 */
export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, patientInfo, location, hospital } = req.body;

  const session = await TriageSessionModel.findOne({ sessionId }).lean();
  if (!session) throw AppError.notFound('Triage session not found');

  const a = session.analysis;
  const aiAnalysisText =
    `${a?.primaryEmergency ?? 'Assessment'} — severity ${String(
      a?.severity
    ).toUpperCase()} at ${a?.confidence ?? 0}% confidence. ${a?.reasoning ?? ''}`.trim();

  const report = await EmergencyReportModel.create({
    reportId: buildReportId(),
    sessionId,
    patientInfo: {
      name: patientInfo?.name || 'Anonymous',
      age: patientInfo?.age,
      gender: patientInfo?.gender || 'unspecified',
      preexistingConditions: patientInfo?.preexistingConditions ?? [],
    },
    incident: {
      description: session.symptoms?.text ?? '',
      timestamp: session.createdAt ?? new Date(),
      location: location || session.userLocation?.address || '',
    },
    severity: a?.severity ?? 'moderate',
    confidence: a?.confidence ?? 0,
    aiAnalysis: aiAnalysisText,
    possibleConditions: a?.possibleConditions ?? [],
    recommendedActions: (a?.actions ?? []).map((x: any) => x.action),
    firstAidSteps: (a?.firstAid ?? []).map((x: any) => x.instruction),
    hospitalDestination: {
      name: hospital?.name ?? '',
      address: hospital?.address ?? '',
      phone: hospital?.phone ?? '',
      distanceKm: hospital?.distanceKm,
    },
    reportGenerated: new Date(),
  });

  res.status(201).json({ success: true, data: report });
});

/**
 * GET /api/v1/reports/:reportId
 */
export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await EmergencyReportModel.findOne({ reportId: req.params.reportId }).lean();
  if (!report) throw AppError.notFound('Report not found');
  res.json({ success: true, data: report });
});

export default { generateReport, getReport };

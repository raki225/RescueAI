import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

/**
 * A shareable emergency report generated for hospital hand-off.
 */
const EmergencyReportSchema = new Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    patientInfo: {
      name: { type: String, default: 'Anonymous' },
      age: { type: Number },
      gender: { type: String, default: 'unspecified' },
      preexistingConditions: { type: [String], default: [] },
    },
    incident: {
      description: { type: String, default: '' },
      timestamp: { type: Date, default: Date.now },
      location: { type: String, default: '' },
    },
    severity: {
      type: String,
      enum: ['critical', 'urgent', 'moderate', 'mild'],
      default: 'moderate',
    },
    confidence: { type: Number, default: 0 },
    aiAnalysis: { type: String, default: '' },
    possibleConditions: [
      { _id: false, condition: String, probability: Number },
    ],
    recommendedActions: { type: [String], default: [] },
    firstAidSteps: { type: [String], default: [] },
    hospitalDestination: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      distanceKm: { type: Number },
    },
    reportGenerated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type EmergencyReport = InferSchemaType<typeof EmergencyReportSchema>;
export type EmergencyReportDoc = HydratedDocument<EmergencyReport>;

export const EmergencyReportModel = model('EmergencyReport', EmergencyReportSchema);
export default EmergencyReportModel;

import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

/**
 * A single triage session — the symptoms a user submitted and the AI analysis produced.
 */
const TriageSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    symptoms: {
      text: { type: String, default: '' },
      hasImage: { type: Boolean, default: false },
      category: { type: String, default: '' },
      imageCategory: { type: String, default: '' },
      answers: { type: Schema.Types.Mixed, default: [] },
    },
    analysis: {
      primaryEmergency: { type: String, default: '' },
      emergencyType: { type: String, default: 'general' },
      severity: {
        type: String,
        enum: ['critical', 'urgent', 'moderate', 'mild'],
        default: 'moderate',
      },
      riskLevel: {
        type: String,
        enum: ['emergency', 'urgent', 'moderate', 'low'],
        default: 'moderate',
      },
      riskScore: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      possibleConditions: [
        {
          _id: false,
          condition: String,
          probability: Number,
        },
      ],
      actions: [
        {
          _id: false,
          priority: Number,
          action: String,
        },
      ],
      firstAid: [
        {
          _id: false,
          step: Number,
          instruction: String,
        },
      ],
      redFlags: [String],
      medicines: [
        {
          _id: false,
          name: String,
          purpose: String,
          dosage: String,
          caution: String,
          category: String,
        },
      ],
      recommendedCare: { type: String, default: '' },
      hospitalRequired: { type: Boolean, default: false },
      ambulanceRequired: { type: Boolean, default: false },
      reasoning: { type: String, default: '' },
      detectedCategory: { type: String, default: '' },
      imageFindings: { type: Schema.Types.Mixed },
      riskContributions: { type: Schema.Types.Mixed, default: [] },
      source: { type: String, enum: ['gemini', 'fallback'], default: 'fallback' },
    },
    userLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
    status: {
      type: String,
      enum: ['pending', 'analyzed', 'resolved'],
      default: 'analyzed',
    },
  },
  { timestamps: true }
);

export type TriageSession = InferSchemaType<typeof TriageSessionSchema>;
export type TriageSessionDoc = HydratedDocument<TriageSession>;

export const TriageSessionModel = model('TriageSession', TriageSessionSchema);
export default TriageSessionModel;

import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

/**
 * A hospital / emergency medical facility.
 * `location` uses GeoJSON Point + a 2dsphere index for `$near` geospatial queries.
 */
const HospitalSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        // [longitude, latitude]
        type: [Number],
        required: true,
      },
    },
    emergencyServices: { type: Boolean, default: true },
    phone: { type: String, default: '' },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    specialties: { type: [String], default: [] },
    availability: {
      beds: { type: Number, default: 0 },
      emergencyBeds: { type: Number, default: 0 },
      ambulances: { type: Number, default: 0 },
    },
    operatingHours: {
      open: { type: String, default: '00:00' },
      close: { type: String, default: '23:59' },
      is24x7: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

HospitalSchema.index({ location: '2dsphere' });

export type Hospital = InferSchemaType<typeof HospitalSchema>;
export type HospitalDoc = HydratedDocument<Hospital>;

export const HospitalModel = model('Hospital', HospitalSchema);
export default HospitalModel;

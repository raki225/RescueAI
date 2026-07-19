import { HospitalModel } from '../models/Hospital';
import { HOSPITAL_SEED } from './hospitals';
import { logger } from '../utils/logger';
import { connectDatabase, disconnectDatabase } from '../config/database';

/**
 * Insert hospital seed data.
 * @param force  When true, wipes and re-inserts. Otherwise seeds only if empty.
 */
export const seedHospitals = async (force = false): Promise<number> => {
  const count = await HospitalModel.estimatedDocumentCount();
  if (count > 0 && !force) {
    logger.info(`Hospitals already seeded (${count}) — skipping.`);
    return count;
  }

  if (force) await HospitalModel.deleteMany({});

  const docs = HOSPITAL_SEED.map((h) => ({
    name: h.name,
    address: h.address,
    location: { type: 'Point' as const, coordinates: h.coordinates },
    emergencyServices: h.emergencyServices,
    phone: h.phone,
    rating: h.rating,
    specialties: h.specialties,
    availability: h.availability,
    operatingHours: h.operatingHours,
  }));

  await HospitalModel.insertMany(docs);
  await HospitalModel.syncIndexes();
  logger.info(`Seeded ${docs.length} hospitals.`);
  return docs.length;
};

/** Allow running directly: `npm run seed`. */
if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await seedHospitals(true);
    } catch (err) {
      logger.error(`Seed failed: ${(err as Error).message}`);
      process.exitCode = 1;
    } finally {
      await disconnectDatabase();
    }
  })();
}

export default seedHospitals;

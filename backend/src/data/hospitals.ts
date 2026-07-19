/**
 * Hospital seed data. Coordinates are GeoJSON [longitude, latitude].
 * Phone is set to the national ambulance line (108) — the correct, safe action
 * during an emergency — rather than fabricated facility numbers.
 */
export interface HospitalSeed {
  name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  emergencyServices: boolean;
  phone: string;
  rating: number;
  specialties: string[];
  availability: { beds: number; emergencyBeds: number; ambulances: number };
  operatingHours: { open: string; close: string; is24x7: boolean };
}

const H = (
  name: string,
  address: string,
  lat: number,
  lng: number,
  specialties: string[],
  rating = 4.3,
  beds = 300,
  emergencyBeds = 20,
  ambulances = 4,
  is24x7 = true
): HospitalSeed => ({
  name,
  address,
  coordinates: [lng, lat],
  emergencyServices: true,
  phone: '108',
  rating,
  specialties,
  availability: { beds, emergencyBeds, ambulances },
  operatingHours: { open: '00:00', close: '23:59', is24x7 },
});

export const HOSPITAL_SEED: HospitalSeed[] = [
  // ── Hyderabad ──────────────────────────────────────────────
  H('Apollo Hospitals', 'Jubilee Hills, Hyderabad', 17.4239, 78.411, ['Cardiology', 'Trauma', 'Neurology', 'Emergency'], 4.6, 550, 40, 8),
  H('KIMS Hospitals', 'Minister Road, Secunderabad', 17.4416, 78.4983, ['Multi-speciality', 'Cardiac', 'Emergency'], 4.5, 1000, 45, 7),
  H('Yashoda Hospitals', 'Somajiguda, Hyderabad', 17.4256, 78.457, ['Oncology', 'Cardiac', 'Trauma', 'Emergency'], 4.4, 500, 35, 6),
  H('CARE Hospitals', 'Banjara Hills, Hyderabad', 17.4156, 78.4483, ['Cardiology', 'Emergency', 'Neurology'], 4.4, 400, 30, 6),
  H('Continental Hospitals', 'Gachibowli, Hyderabad', 17.418, 78.348, ['Multi-speciality', 'Emergency', 'Trauma'], 4.5, 550, 38, 6),
  H('AIG Hospitals', 'Gachibowli, Hyderabad', 17.429, 78.341, ['Gastroenterology', 'Emergency', 'Critical Care'], 4.6, 800, 50, 8),
  H('NIMS', "Nizam's Institute, Punjagutta, Hyderabad", 17.427, 78.448, ['Government', 'Trauma', 'Emergency', 'Neurology'], 4.2, 1500, 60, 10),
  H('Osmania General Hospital', 'Afzalgunj, Hyderabad', 17.372, 78.4757, ['Government', 'Emergency', 'Trauma'], 4.0, 1200, 55, 9),
  H('Gandhi Hospital', 'Musheerabad, Secunderabad', 17.427, 78.501, ['Government', 'Emergency', 'Trauma'], 4.0, 1000, 50, 8),
  H('Sunshine Hospitals', 'Paradise Circle, Secunderabad', 17.443, 78.501, ['Orthopaedics', 'Cardiac', 'Emergency'], 4.3, 500, 30, 5),
  H('Star Hospitals', 'Road No 10, Banjara Hills, Hyderabad', 17.415, 78.442, ['Cardiac', 'Neuro', 'Emergency'], 4.3, 350, 25, 5),
  H("Rainbow Children's Hospital", 'Banjara Hills, Hyderabad', 17.413, 78.446, ['Paediatrics', 'Neonatal', 'Emergency'], 4.4, 250, 20, 4),

  // ── Other metros (broader coverage) ────────────────────────
  H('Manipal Hospital', 'Old Airport Road, Bengaluru', 12.958, 77.649, ['Multi-speciality', 'Emergency', 'Cardiac'], 4.4, 600, 40, 7),
  H('Apollo Hospitals', 'Greams Road, Chennai', 13.063, 80.251, ['Cardiac', 'Transplant', 'Emergency'], 4.5, 700, 45, 8),
  H('Lilavati Hospital', 'Bandra West, Mumbai', 19.0509, 72.829, ['Multi-speciality', 'Emergency', 'Cardiac'], 4.4, 350, 30, 6),
  H('AIIMS', 'Ansari Nagar, New Delhi', 28.567, 77.21, ['Government', 'Trauma', 'Emergency', 'All'], 4.3, 2500, 80, 12),
];

export default HOSPITAL_SEED;

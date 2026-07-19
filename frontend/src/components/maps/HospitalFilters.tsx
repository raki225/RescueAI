import { motion } from 'framer-motion';
import { HOSPITAL_TYPE_FILTERS, SERVICE_FILTERS, RADIUS_STEPS } from '../../utils/constants';

interface HospitalFiltersProps {
  ownership: string;
  onOwnership: (v: 'all' | 'government' | 'private') => void;
  service: string;
  onService: (v: string) => void;
  radiusKm: number;
  onRadius: (v: number) => void;
}

export const HospitalFilters = ({
  ownership,
  onOwnership,
  service,
  onService,
  radiusKm,
  onRadius,
}: HospitalFiltersProps) => {
  return (
    <div className="space-y-3">
      {/* Type + radius */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {HOSPITAL_TYPE_FILTERS.map((t) => {
            const active = ownership === t.key;
            return (
              <motion.button
                key={t.key}
                whileTap={{ scale: 0.96 }}
                onClick={() => onOwnership(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                  active
                    ? 'bg-gradient-to-r from-[#0F3DDE] to-secondary text-white shadow-lg shadow-[#0F3DDE]/25'
                    : 'border border-[#E8EDF5] bg-white text-primary hover:border-[#0F3DDE]/40'
                }`}
              >
                <span>{t.emoji}</span> {t.label}
              </motion.button>
            );
          })}
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
          Radius
          <select
            value={radiusKm}
            onChange={(e) => onRadius(Number(e.target.value))}
            className="focus-ring rounded-lg border border-[#E8EDF5] bg-white px-2 py-1.5 text-sm font-bold text-primary outline-none"
          >
            {RADIUS_STEPS.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Services — wrap into rows (no horizontal scroll) */}
      <div className="flex flex-wrap gap-2">
        {SERVICE_FILTERS.map((s) => {
          const active = service === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onService(s.key)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? 'border-secondary bg-secondary/10 text-secondary'
                  : 'border-[#E8EDF5] bg-white text-muted hover:border-secondary/40 hover:text-secondary'
              }`}
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HospitalFilters;

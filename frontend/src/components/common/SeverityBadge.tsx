import { motion } from 'framer-motion';
import { Severity } from '../../types';
import { SEVERITY_META } from '../../utils/constants';

interface SeverityBadgeProps {
  level: Severity;
  confidence?: number;
  showConfidence?: boolean;
  size?: 'sm' | 'lg';
}

export const SeverityBadge = ({
  level,
  confidence,
  showConfidence = false,
  size = 'lg',
}: SeverityBadgeProps) => {
  const meta = SEVERITY_META[level];
  const isCritical = level === 'critical';
  const large = size === 'lg';

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={
          isCritical
            ? { scale: [1, 1.03, 1], opacity: 1 }
            : { scale: 1, opacity: 1 }
        }
        transition={
          isCritical
            ? { scale: { repeat: Infinity, duration: 1.6 }, opacity: { duration: 0.3 } }
            : { duration: 0.3 }
        }
        className={`inline-flex items-center gap-2 rounded-full font-extrabold uppercase tracking-wide text-white ${
          large ? 'px-7 py-3 text-2xl' : 'px-4 py-1.5 text-sm'
        }`}
        style={{
          backgroundColor: meta.color,
          boxShadow: isCritical ? `0 0 0 6px ${meta.color}22` : 'none',
        }}
      >
        {isCritical && <span className="h-2.5 w-2.5 animate-ping rounded-full bg-white" />}
        {meta.label}
      </motion.div>

      {large && <p className="text-sm font-medium text-muted">{meta.timeframe}</p>}

      {showConfidence && typeof confidence === 'number' && (
        <div className="w-full max-w-xs">
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted">
            <span>AI confidence</span>
            <span className="font-bold text-primary">{confidence}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: meta.color }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SeverityBadge;

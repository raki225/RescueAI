import { motion } from 'framer-motion';

interface RiskGaugeProps {
  score: number; // 0–100
  color: string;
  label?: string;
  size?: number;
}

/** Animated radial gauge for a 0–100 risk score. */
export const RiskGauge = ({ score, color, label = 'Risk', size = 128 }: RiskGaugeProps) => {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="relative grid place-items-center" style={{ height: size, width: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={size * 0.08}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-primary">{Math.round(clamped)}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      </div>
    </div>
  );
};

export default RiskGauge;

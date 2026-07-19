import { motion } from 'framer-motion';
import { Activity, ShieldPlus, HeartPulse } from 'lucide-react';

/** Full-screen branded splash used while routes/chunks load. */
export const BrandedLoader = ({ label = 'Loading RescueAI…' }: { label?: string }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative grid h-20 w-20 place-items-center"
    >
      <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-secondary to-primary opacity-20 blur-xl" />
      <motion.span
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-glass-lg"
      >
        <ShieldPlus className="h-8 w-8" />
      </motion.span>
    </motion.div>

    <div>
      <p className="flex items-center justify-center gap-1.5 text-lg font-extrabold text-primary">
        Rescue<span className="text-accent">AI</span>
        <HeartPulse className="h-4 w-4 text-danger" />
      </p>
      <p className="mt-1 text-sm font-medium text-muted">{label}</p>
    </div>

    {/* Indeterminate progress bar */}
    <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
      <motion.div
        className="h-full w-1/3 rounded-full bg-gradient-to-r from-secondary to-accent"
        animate={{ x: ['-120%', '360%'] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
      />
    </div>
  </div>
);

/** Full-screen "AI is analysing" state with staged reasoning cues. */
export const AnalyzingLoader = ({ steps }: { steps?: string[] }) => {
  const items = steps ?? [
    'Parsing symptom description…',
    'Matching emergency protocols…',
    'Assessing severity & confidence…',
    'Preparing recommended actions…',
  ];
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary text-white shadow-glass-lg"
      >
        <Activity className="h-9 w-9" />
      </motion.div>
      <div className="space-y-2">
        {items.map((s, i) => (
          <motion.p
            key={s}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.5 }}
            className="text-sm font-medium text-muted"
          >
            {s}
          </motion.p>
        ))}
      </div>
    </div>
  );
};

/** Simple inline spinner block. */
export const Spinner = ({ label }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-8 text-muted">
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      className="h-6 w-6 rounded-full border-2 border-secondary border-t-transparent"
    />
    {label && <span className="text-sm font-medium">{label}</span>}
  </div>
);

/** Content skeleton placeholder. */
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />
);

export default AnalyzingLoader;

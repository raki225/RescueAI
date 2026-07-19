import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface Step {
  label: string;
  desc?: string;
}

interface StepperProps {
  steps: Step[];
  /** 0-based index of the current (active) step. */
  current: number;
  className?: string;
}

/** Connected horizontal timeline: done ✓ · active ● · upcoming ○ */
export const Stepper = ({ steps, current, className = '' }: StepperProps) => {
  return (
    <div className={`flex items-start ${className}`}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={s.label}>
            <div className="flex flex-1 flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition-colors ${
                  done
                    ? 'bg-safe text-white'
                    : active
                      ? 'bg-secondary text-white ring-4 ring-secondary/20'
                      : 'bg-slate-200 text-muted'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </motion.div>
              <span
                className={`mt-2 text-xs font-semibold ${
                  active ? 'text-primary' : done ? 'text-safe' : 'text-muted'
                }`}
              >
                {s.label}
              </span>
              {s.desc && (
                <span className="mt-0.5 hidden text-[11px] text-muted sm:block">{s.desc}</span>
              )}
            </div>

            {i < steps.length - 1 && (
              <div className="relative mt-4 h-0.5 flex-1 rounded-full bg-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i < current ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 rounded-full bg-safe"
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;

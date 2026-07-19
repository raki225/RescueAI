import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { TriageAction } from '../../types';

interface ActionListProps {
  actions: TriageAction[];
}

/** Prioritised, checkable action list — helps a panicking user work through steps. */
export const ActionList = ({ actions }: ActionListProps) => {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const sorted = [...actions].sort((a, b) => a.priority - b.priority);

  return (
    <ul className="space-y-2.5">
      {sorted.map((a, i) => {
        const isDone = done[a.priority];
        return (
          <motion.li
            key={`${a.priority}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <button
              type="button"
              onClick={() => setDone((d) => ({ ...d, [a.priority]: !d[a.priority] }))}
              className={`focus-ring flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                isDone
                  ? 'border-safe/40 bg-safe/5'
                  : 'border-slate-200 bg-white/70 hover:border-secondary/50'
              }`}
            >
              <span
                className={`mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                  isDone ? 'bg-safe text-white' : 'bg-primary/10 text-primary'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : a.priority}
              </span>
              <span
                className={`text-sm leading-snug ${
                  isDone ? 'text-muted line-through' : 'text-ink'
                }`}
              >
                {a.action}
              </span>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
};

export default ActionList;

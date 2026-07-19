import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, ChevronDown, ShieldAlert, Printer } from 'lucide-react';
import { Spinner } from '../components/common/Loading';
import { useTriageStore } from '../store/triageStore';
import { hospitalService } from '../services/api/hospitalService';
import { toApiError } from '../services/api/client';
import { FirstAidGuide } from '../types';
import { EMERGENCY_TYPE_ICON } from '../utils/constants';
import { pageTransition } from '../utils/motion';

export const FirstAid = () => {
  const { result } = useTriageStore();
  const [guides, setGuides] = useState<FirstAidGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(result?.analysis.emergencyType ?? null);

  useEffect(() => {
    (async () => {
      try {
        const data = await hospitalService.getFirstAidGuides();
        // Surface the relevant guide first when we have a triage result.
        const relevant = result?.analysis.emergencyType;
        const sorted = relevant
          ? [...data].sort((a, b) =>
              a.type === relevant ? -1 : b.type === relevant ? 1 : 0
            )
          : data;
        setGuides(sorted);
      } catch (err) {
        setError(toApiError(err).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [result]);

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="app-container-tight section-y"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">
            Bystander-safe guidance
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-primary sm:text-3xl">
            <HeartPulse className="h-6 w-6 text-danger" /> First Aid
          </h1>
        </div>
        <button
          onClick={() => window.print()}
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-muted transition hover:text-primary"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      {result && (
        <div className="mb-4 rounded-xl border border-secondary/20 bg-secondary/5 p-3 text-sm text-primary">
          Showing guidance most relevant to your assessment:{' '}
          <strong>{result.analysis.primaryEmergency}</strong>
        </div>
      )}

      {loading ? (
        <Spinner label="Loading first-aid guides…" />
      ) : error ? (
        <p className="rounded-xl bg-danger/10 p-4 text-sm font-medium text-danger">{error}</p>
      ) : (
        <div className="space-y-3">
          {guides.map((g) => {
            const isOpen = open === g.type;
            const highlight = result?.analysis.emergencyType === g.type;
            return (
              <div
                key={g.type}
                className={`overflow-hidden rounded-2xl border bg-white/80 ${
                  highlight ? 'border-secondary/50 ring-1 ring-secondary/20' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : g.type)}
                  className="focus-ring flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="flex items-center gap-3 font-bold text-primary">
                    <span className="text-2xl">{EMERGENCY_TYPE_ICON[g.type]}</span>
                    {g.label}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-muted transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="border-t border-slate-100 p-4">
                        <ol className="space-y-2">
                          {g.steps.map((s, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-ink">
                              <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {i + 1}
                              </span>
                              {s}
                            </li>
                          ))}
                        </ol>

                        {g.redFlags.length > 0 && (
                          <div className="mt-4 rounded-xl bg-danger/5 p-3">
                            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-danger">
                              <ShieldAlert className="h-4 w-4" /> Call 108 immediately if
                            </p>
                            <ul className="grid gap-1 sm:grid-cols-2">
                              {g.redFlags.map((r) => (
                                <li key={r} className="flex items-start gap-1.5 text-xs text-ink">
                                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-danger" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default FirstAid;

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  HeartPulse,
  FileText,
  Brain,
  ShieldAlert,
  Ambulance,
  Sparkles,
  Cpu,
  Activity,
  ArrowRight,
  Phone,
  ListChecks,
  Pill,
  Ban,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { GlassCard } from '../components/common/GlassCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { Stepper } from '../components/common/Stepper';
import { RiskGauge } from '../components/common/RiskGauge';
import { ActionList } from '../components/triage/ActionList';
import { ImageFindingsCard } from '../components/image/ImageFindingsCard';
import { useTriageStore } from '../store/triageStore';
import { pageTransition, slideUp, stagger } from '../utils/motion';
import {
  EMERGENCY_TYPE_ICON,
  EMERGENCY_TYPE_LABEL,
  RISK_LEVEL_META,
  SEVERITY_META,
} from '../utils/constants';
import { percent } from '../utils/formatters';

const STEPS = [{ label: 'Describe' }, { label: 'Questions' }, { label: 'Assessment' }];

export const Results = () => {
  const navigate = useNavigate();
  const { result } = useTriageStore();

  useEffect(() => {
    if (!result) navigate('/triage', { replace: true });
  }, [result, navigate]);

  if (!result) return null;
  const a = result.analysis;
  const risk = RISK_LEVEL_META[a.riskLevel];
  const meta = SEVERITY_META[a.severity];

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="app-container-md section-y"
    >
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-secondary">
        Step 3 of 3 · AI Assessment
      </p>
      <div className="mb-5">
        <Stepper steps={STEPS} current={2} />
      </div>

      {/* Hero: risk level + score gauge */}
      <GlassCard padding="lg">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-sm font-semibold text-primary">
          <span className="text-lg">{EMERGENCY_TYPE_ICON[a.emergencyType]}</span>
          {EMERGENCY_TYPE_LABEL[a.emergencyType]}
          {a.detectedCategory ? ` · ${a.detectedCategory}` : ''}
        </div>

        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div className="text-center sm:text-left">
            <h1 className="mb-3 text-2xl font-extrabold text-primary sm:text-3xl">
              {a.primaryEmergency}
            </h1>

            {/* Big risk-level banner */}
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-white shadow-md"
              style={{ backgroundColor: risk.color }}
            >
              <span className="text-lg">{risk.emoji}</span>
              <div className="text-left leading-tight">
                <p className="text-sm font-extrabold tracking-wide">{risk.label}</p>
                <p className="text-[11px] font-medium opacity-90">{risk.description}</p>
              </div>
            </div>

            <div className="flex justify-center sm:justify-start">
              <SeverityBadge level={a.severity} confidence={a.confidence} showConfidence />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <RiskGauge score={a.riskScore} color={risk.color} label="Score" />
            <span className="text-[11px] font-semibold text-muted">0–100 risk score</span>
          </div>
        </div>

        {/* Recommended action */}
        <div
          className="mt-5 flex items-start gap-3 rounded-2xl border-l-4 p-4"
          style={{ borderColor: risk.color, backgroundColor: `${risk.color}0f` }}
        >
          <Activity className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: risk.color }} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Recommended action</p>
            <p className="text-sm font-semibold text-ink">{a.recommendedCare}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/70 pt-4 text-xs sm:justify-start">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-muted">
            {a.source === 'gemini' ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-secondary" /> Gemini AI
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5 text-secondary" /> AI Safety Engine
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-muted">
            <Activity className="h-3.5 w-3.5 text-accent" /> {meta.timeframe}
          </span>
          {a.ambulanceRequired && (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-3 py-1 font-semibold text-danger">
              <Ambulance className="h-3.5 w-3.5" /> Ambulance advised
            </span>
          )}
        </div>

        {/* Emergency call for high-risk */}
        {(a.riskLevel === 'emergency' || a.riskLevel === 'urgent') && (
          <a
            href="tel:108"
            className="ripple mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-danger to-accent px-5 py-3.5 text-base font-extrabold text-white shadow-lg shadow-danger/30"
          >
            <Phone className="h-5 w-5" /> Call 108 Ambulance now
          </a>
        )}
      </GlassCard>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {/* Image findings */}
        {result.imageAnalysis && (
          <motion.div variants={slideUp} className="lg:col-span-2">
            <ImageFindingsCard analysis={result.imageAnalysis} />
          </motion.div>
        )}

        {/* Reasoning */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <GlassCard>
            <h2 className="mb-2 flex items-center gap-2 font-bold text-primary">
              <Brain className="h-5 w-5 text-secondary" /> Medical reasoning
            </h2>
            <p className="text-sm leading-relaxed text-ink">{a.reasoning}</p>
          </GlassCard>
        </motion.div>

        {/* Possible conditions */}
        {a.possibleConditions.length > 0 && (
          <motion.div variants={slideUp}>
            <GlassCard>
              <h2 className="mb-3 font-bold text-primary">Possible conditions</h2>
              <div className="space-y-3">
                {a.possibleConditions.map((c) => (
                  <div key={c.condition}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink">{c.condition}</span>
                      <span className="font-semibold text-muted">{percent(c.probability)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(c.probability * 100)}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* First aid */}
        {a.firstAid.length > 0 && (
          <motion.div variants={slideUp}>
            <GlassCard>
              <h2 className="mb-3 flex items-center gap-2 font-bold text-primary">
                <HeartPulse className="h-5 w-5 text-safe" /> First aid — do this now
              </h2>
              <ol className="space-y-2">
                {a.firstAid.map((s) => (
                  <li key={s.step} className="flex items-start gap-3 text-sm text-ink">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-safe/15 text-xs font-bold text-safe">
                      {s.step}
                    </span>
                    {s.instruction}
                  </li>
                ))}
              </ol>
            </GlassCard>
          </motion.div>
        )}

        {/* Suggested medicines / tablets */}
        {a.medicines && a.medicines.length > 0 && (
          <motion.div variants={slideUp}>
            <GlassCard>
              <h2 className="mb-1 flex items-center gap-2 font-bold text-primary">
                <Pill className="h-5 w-5 text-secondary" /> Suggested medicines / tablets
              </h2>
              <p className="mb-3 text-xs leading-relaxed text-muted">
                General over-the-counter guidance only — <strong>not a prescription</strong>. Follow
                the label, check for allergies, and never delay emergency care to find a tablet.
              </p>
              <div className="space-y-2.5">
                {a.medicines.map((m) => {
                  const avoid = m.category === 'avoid';
                  const rx = m.category === 'prescription';
                  return (
                    <div
                      key={m.name}
                      className={`rounded-2xl border p-3 ${
                        avoid
                          ? 'border-danger/30 bg-danger/5'
                          : rx
                            ? 'border-accent/30 bg-accent/5'
                            : 'border-slate-200 bg-white/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`flex items-center gap-2 text-sm font-bold ${
                            avoid ? 'text-danger' : 'text-primary'
                          }`}
                        >
                          {avoid ? (
                            <Ban className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <Pill className="h-4 w-4 flex-shrink-0 text-secondary" />
                          )}
                          {m.name}
                        </p>
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            avoid
                              ? 'bg-danger/10 text-danger'
                              : rx
                                ? 'bg-accent/10 text-accent'
                                : 'bg-safe/15 text-safe'
                          }`}
                        >
                          {avoid ? 'Avoid' : rx ? 'If prescribed' : 'OTC'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink">{m.purpose}</p>
                      {m.dosage && (
                        <p className="mt-1 text-xs font-semibold text-muted">Dose: {m.dosage}</p>
                      )}
                      {m.caution && (
                        <p className="mt-1 flex items-start gap-1 text-xs text-danger/90">
                          <ShieldAlert className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          {m.caution}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Recommended actions */}
        {a.actions.length > 0 && (
          <motion.div variants={slideUp}>
            <GlassCard>
              <h2 className="mb-3 flex items-center gap-2 font-bold text-primary">
                <ListChecks className="h-5 w-5 text-secondary" /> Next steps — in order
              </h2>
              <ActionList actions={a.actions} />
            </GlassCard>
          </motion.div>
        )}

        {/* Red flags */}
        {a.redFlags.length > 0 && (
          <motion.div variants={slideUp}>
            <div className="rounded-glass border border-danger/30 bg-danger/5 p-6">
              <h2 className="mb-2 flex items-center gap-2 font-bold text-danger">
                <ShieldAlert className="h-5 w-5" /> Call 108/112 immediately if you see
              </h2>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {a.redFlags.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-ink">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-danger" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Nearby hospitals CTA */}
        <motion.div variants={slideUp} className="lg:col-span-2">
          <button
            onClick={() => navigate('/hospitals')}
            className="focus-ring group flex w-full items-center justify-between gap-3 rounded-glass border border-secondary/20 bg-gradient-to-r from-secondary/10 to-accent/5 p-5 text-left transition hover:border-secondary/40"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-white shadow-md">
                <MapPin className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-bold text-primary">
                  Nearby Government &amp; Private hospitals
                </span>
                <span className="text-xs text-muted">
                  Live location · sorted by distance &amp; ETA · one-tap directions
                </span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 flex-shrink-0 text-secondary transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>

      {/* Actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button variant="primary" icon={<MapPin className="h-5 w-5" />} onClick={() => navigate('/hospitals')}>
          Find Hospital
        </Button>
        <Button variant="secondary" icon={<HeartPulse className="h-5 w-5" />} onClick={() => navigate('/first-aid')}>
          First Aid
        </Button>
        <Button variant="safe" icon={<FileText className="h-5 w-5" />} onClick={() => navigate('/report')}>
          Generate Report
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted">{a.disclaimer}</p>
    </motion.div>
  );
};

export default Results;

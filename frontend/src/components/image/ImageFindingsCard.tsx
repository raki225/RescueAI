import { motion } from 'framer-motion';
import { Eye, ScanSearch } from 'lucide-react';
import { ImageAnalysis } from '../../types';
import { percent } from '../../utils/formatters';
import { IMAGE_DISCLAIMER } from '../../utils/constants';

const FINDING_FLAGS: { key: keyof ImageAnalysis['findings']; label: string; emoji: string }[] = [
  { key: 'redness', label: 'Redness', emoji: '🔴' },
  { key: 'swelling', label: 'Swelling', emoji: '🎈' },
  { key: 'blisters', label: 'Blisters', emoji: '💧' },
  { key: 'openWound', label: 'Open wound', emoji: '🩹' },
  { key: 'bleeding', label: 'Bleeding', emoji: '🩸' },
  { key: 'infectionSigns', label: 'Infection signs', emoji: '🦠' },
];

const DETAILS: { key: keyof ImageAnalysis['findings']; label: string }[] = [
  { key: 'skinColor', label: 'Skin colour' },
  { key: 'size', label: 'Size' },
  { key: 'shape', label: 'Shape' },
  { key: 'rashDistribution', label: 'Distribution' },
  { key: 'burnSeverity', label: 'Burn severity' },
];

const notAssessed = (v: string) => !v || /not assessed|none|n\/a|unknown/i.test(v);

export const ImageFindingsCard = ({ analysis }: { analysis: ImageAnalysis }) => {
  const f = analysis.findings;
  const present = FINDING_FLAGS.filter((flag) => Boolean(f[flag.key]));
  const details = DETAILS.filter((d) => !notAssessed(String(f[d.key])));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-glass border border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-primary">
          <ScanSearch className="h-5 w-5 text-secondary" /> Image findings
        </h2>
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-secondary">
          {analysis.confidence}% confidence
        </span>
      </div>

      <p className="mb-3 text-sm text-muted">
        Detected: <span className="font-semibold text-primary">{analysis.categoryLabel}</span>
        {analysis.source === 'gemini' ? ' · AI vision' : ' · offline mode'}
      </p>

      {present.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {present.map((flag) => (
            <span
              key={flag.key}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary shadow-sm"
            >
              <span>{flag.emoji}</span> {flag.label}
            </span>
          ))}
        </div>
      )}

      {details.length > 0 && (
        <dl className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {details.map((d) => (
            <div key={d.key} className="rounded-xl bg-white/70 px-3 py-2">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{d.label}</dt>
              <dd className="text-sm font-medium capitalize text-ink">{String(f[d.key])}</dd>
            </div>
          ))}
        </dl>
      )}

      {analysis.possibleConditions.length > 0 && (
        <div className="mb-1">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            <Eye className="h-3.5 w-3.5" /> Possible visible condition(s)
          </p>
          <div className="space-y-2">
            {analysis.possibleConditions.map((c) => (
              <div key={c.condition}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink">{c.condition}</span>
                  <span className="font-semibold text-muted">{percent(c.probability)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(c.probability * 100)}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {f.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {f.notes.map((n, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-secondary" /> {n}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 rounded-xl bg-white/60 p-2.5 text-[11px] leading-relaxed text-muted">
        {IMAGE_DISCLAIMER}
      </p>
    </motion.div>
  );
};

export default ImageFindingsCard;

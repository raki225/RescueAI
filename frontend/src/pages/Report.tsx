import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Printer, RotateCcw, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { GlassCard } from '../components/common/GlassCard';
import { ReportPreview } from '../components/report/ReportPreview';
import { useTriageStore } from '../store/triageStore';
import { reportService } from '../services/api/reportService';
import { toApiError } from '../services/api/client';
import { pageTransition } from '../utils/motion';

export const Report = () => {
  const navigate = useNavigate();
  const { result, location, selectedHospital, report, setReport } = useTriageStore();
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'unspecified',
    preexisting: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!result) navigate('/triage', { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const generated = await reportService.generate({
        sessionId: result.sessionId,
        patientInfo: {
          name: form.name || 'Anonymous',
          age: form.age ? Number(form.age) : undefined,
          gender: form.gender,
          preexistingConditions: form.preexisting
            ? form.preexisting.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        },
        location: location?.address,
        hospital: selectedHospital
          ? {
              name: selectedHospital.name,
              address: selectedHospital.address,
              phone: selectedHospital.phone,
              distanceKm: selectedHospital.distanceKm,
            }
          : undefined,
      });
      setReport(generated);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="app-container-tight section-y"
    >
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-secondary">
        Step 3 of 3 · Hand-off
      </p>
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-primary sm:text-3xl">
        <FileText className="h-6 w-6 text-safe" /> Emergency Report
      </h1>

      {!report ? (
        <GlassCard padding="lg" className="no-print space-y-4">
          <p className="text-sm text-muted">
            Add optional patient details to generate a printable report for hospital hand-off.
            The AI assessment is included automatically.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Patient name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="input"
              />
            </Field>
            <Field label="Age">
              <input
                type="number"
                min={0}
                max={130}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="e.g. 54"
                className="input"
              />
            </Field>
            <Field label="Gender">
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input"
              >
                <option value="unspecified">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Pre-existing conditions">
              <input
                value={form.preexisting}
                onChange={(e) => setForm({ ...form, preexisting: e.target.value })}
                placeholder="Diabetes, Hypertension…"
                className="input"
              />
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/60 p-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-primary">
              <Building2 className="h-4 w-4" /> Destination hospital
            </span>
            <p className="mt-1 text-muted">
              {selectedHospital
                ? `${selectedHospital.name} · ${selectedHospital.distanceKm} km`
                : 'None selected — pick one on the Hospitals page (optional).'}
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger">{error}</p>
          )}

          <Button
            fullWidth
            size="lg"
            variant="safe"
            loading={loading}
            icon={<FileText className="h-5 w-5" />}
            onClick={handleGenerate}
          >
            Generate Report
          </Button>
        </GlassCard>
      ) : (
        <div>
          <div className="no-print mb-4 flex items-center gap-2 rounded-xl bg-safe/10 p-3 text-sm font-medium text-safe">
            <CheckCircle2 className="h-5 w-5" /> Report {report.reportId} ready.
          </div>

          <div className="glass p-2 sm:p-3">
            <ReportPreview ref={printRef} report={report} />
          </div>

          <div className="no-print mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="primary" icon={<Printer className="h-5 w-5" />} onClick={() => window.print()}>
              Print / Save as PDF
            </Button>
            <Button
              variant="secondary"
              icon={<RotateCcw className="h-5 w-5" />}
              onClick={() => setReport(null)}
            >
              Edit details
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-semibold text-primary">{label}</span>
    {children}
  </label>
);

export default Report;

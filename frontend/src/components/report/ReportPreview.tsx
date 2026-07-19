import { forwardRef } from 'react';
import { EmergencyReport } from '../../types';
import { SEVERITY_META, MEDICAL_DISCLAIMER } from '../../utils/constants';
import { formatDateTime, percent } from '../../utils/formatters';

interface ReportPreviewProps {
  report: EmergencyReport;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2 py-1 text-sm">
    <span className="w-36 flex-shrink-0 font-semibold text-muted">{label}</span>
    <span className="text-ink">{value || '—'}</span>
  </div>
);

/** Printable emergency report for hospital hand-off. */
export const ReportPreview = forwardRef<HTMLDivElement, ReportPreviewProps>(
  ({ report }, ref) => {
    const meta = SEVERITY_META[report.severity];
    return (
      <div ref={ref} id="report-print" className="rounded-2xl bg-white p-6 sm:p-8">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-primary">
              Rescue<span className="text-accent">AI</span> Emergency Report
            </h1>
            <p className="text-xs text-muted">Report ID: {report.reportId}</p>
          </div>
          <span
            className="rounded-full px-4 py-1.5 text-sm font-extrabold uppercase text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        <section className="mt-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-secondary">
            Patient
          </h2>
          <Row label="Name" value={report.patientInfo.name} />
          <Row
            label="Age / Gender"
            value={`${report.patientInfo.age ?? '—'} · ${report.patientInfo.gender}`}
          />
          <Row
            label="Pre-existing"
            value={report.patientInfo.preexistingConditions.join(', ')}
          />
        </section>

        <section className="mt-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-secondary">
            Incident
          </h2>
          <Row label="Reported" value={formatDateTime(report.incident.timestamp)} />
          <Row label="Location" value={report.incident.location} />
          <Row label="Description" value={report.incident.description} />
        </section>

        <section className="mt-4">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-secondary">
            AI Assessment
          </h2>
          <Row label="Confidence" value={`${report.confidence}%`} />
          <p className="mt-1 text-sm text-ink">{report.aiAnalysis}</p>
          {report.possibleConditions.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-sm text-ink">
              {report.possibleConditions.map((c) => (
                <li key={c.condition}>
                  • {c.condition}{' '}
                  <span className="text-muted">({percent(c.probability)})</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-secondary">
              Recommended actions
            </h2>
            <ol className="list-decimal space-y-0.5 pl-5 text-sm text-ink">
              {report.recommendedActions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </section>
          <section>
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-secondary">
              First aid given
            </h2>
            <ol className="list-decimal space-y-0.5 pl-5 text-sm text-ink">
              {report.firstAidSteps.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </section>
        </div>

        {report.hospitalDestination.name && (
          <section className="mt-4">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-secondary">
              Destination hospital
            </h2>
            <Row label="Hospital" value={report.hospitalDestination.name} />
            <Row label="Address" value={report.hospitalDestination.address} />
            <Row
              label="Distance"
              value={
                report.hospitalDestination.distanceKm
                  ? `${report.hospitalDestination.distanceKm} km`
                  : '—'
              }
            />
          </section>
        )}

        <p className="mt-6 border-t border-slate-200 pt-3 text-[11px] leading-snug text-muted">
          {MEDICAL_DISCLAIMER} Generated {formatDateTime(report.reportGenerated)}.
        </p>
      </div>
    );
  }
);

ReportPreview.displayName = 'ReportPreview';
export default ReportPreview;

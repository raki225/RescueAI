import { AlertTriangle } from 'lucide-react';

/** Persistent, high-contrast medical disclaimer strip. */
export const EmergencyBanner = () => (
  <div className="border-b border-amber-200 bg-amber-50/80 text-amber-900 backdrop-blur">
    <div className="app-container flex items-center gap-2 py-1.5 text-xs">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <p className="leading-tight">
        AI assists decision-making — for life-threatening emergencies call{' '}
        <a href="tel:108" className="font-bold underline">
          108
        </a>{' '}
        /{' '}
        <a href="tel:112" className="font-bold underline">
          112
        </a>{' '}
        immediately.
      </p>
    </div>
  </div>
);

export default EmergencyBanner;

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Navigation,
  Phone,
  Clock,
  BedDouble,
  Ambulance,
  MapPin,
  Bookmark,
  Share2,
  Activity,
  Wind,
  Check,
} from 'lucide-react';
import { Hospital } from '../../types';
import { formatDistance, formatEta } from '../../utils/formatters';
import { HOSPITAL_CATEGORY_LABEL } from '../../utils/constants';

interface HospitalCardProps {
  hospital: Hospital;
  selected?: boolean;
  saved?: boolean;
  onSelect?: (hospital: Hospital) => void;
  onToggleSave?: (hospital: Hospital) => void;
}

const bedStatus = (emergencyBeds: number) => {
  if (emergencyBeds >= 10) return { label: 'Beds available', color: '#16C784', bg: 'rgba(22,199,132,0.12)' };
  if (emergencyBeds >= 3) return { label: 'Busy', color: '#FF6B35', bg: 'rgba(255,107,53,0.12)' };
  return { label: 'Almost full', color: '#E53935', bg: 'rgba(229,57,53,0.12)' };
};

export const HospitalCard = ({
  hospital,
  selected,
  saved,
  onSelect,
  onToggleSave,
}: HospitalCardProps) => {
  const [copied, setCopied] = useState(false);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`;
  const status = bedStatus(hospital.availability.emergencyBeds);
  const isGov = hospital.ownership === 'government';
  const area = hospital.address ? hospital.address.split(',')[0] : 'Location on map';

  const share = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${hospital.name} — ${formatDistance(hospital.distanceKm)} away. Directions: ${directionsUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: hospital.name, text, url: directionsUrl });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* user cancelled */
    }
  };

  const stats = [
    { icon: BedDouble, label: 'Beds', value: hospital.availability.emergencyBeds },
    { icon: Activity, label: 'ICU', value: hospital.availability.icuBeds },
    { icon: Wind, label: 'Ventilators', value: hospital.availability.ventilators },
    { icon: Ambulance, label: 'Ambulances', value: hospital.availability.ambulances },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={() => onSelect?.(hospital)}
      className={`group cursor-pointer rounded-[20px] border bg-white p-4 transition-shadow ${
        selected
          ? 'border-[#0F3DDE] shadow-[0_16px_40px_rgba(15,61,222,0.18)] ring-1 ring-[#0F3DDE]/30'
          : 'border-[#E8EDF5] shadow-[0_6px_20px_rgba(15,23,42,0.05)] hover:border-[#0F3DDE]/50 hover:shadow-[0_16px_40px_rgba(15,61,222,0.14)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                isGov ? 'bg-[#1E88E5]/12 text-[#1E88E5]' : 'bg-[#E53935]/12 text-[#E53935]'
              }`}
            >
              {isGov ? '🏛️' : '🏢'} {HOSPITAL_CATEGORY_LABEL[hospital.category]}
            </span>
            {hospital.source === 'live' && (
              <span className="rounded-full bg-[#16C784]/12 px-2 py-0.5 text-[10px] font-bold text-[#16C784]">
                Live
              </span>
            )}
          </div>
          <h3 className="mt-1 truncate text-[15px] font-extrabold text-primary">{hospital.name}</h3>
          <p className="mt-0.5 inline-flex items-center gap-1 truncate text-xs text-muted">
            <MapPin className="h-3 w-3 flex-shrink-0 text-[#0F3DDE]" /> {area}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {hospital.rating.toFixed(1)}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave?.(hospital);
            }}
            className={`grid h-8 w-8 place-items-center rounded-full border transition ${
              saved
                ? 'border-[#0F3DDE] bg-[#0F3DDE]/10 text-[#0F3DDE]'
                : 'border-[#E8EDF5] text-muted hover:border-[#0F3DDE]/40 hover:text-[#0F3DDE]'
            }`}
            aria-label={saved ? 'Unsave' : 'Save'}
            title={saved ? 'Saved' : 'Save'}
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
          style={{ color: status.color, backgroundColor: status.bg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
          {status.label}
        </span>
        {hospital.is24x7 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600">
            🟢 24×7
          </span>
        )}
        {hospital.emergencyServices && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E53935]/10 px-2.5 py-1 text-[#E53935]">
            🚨 Emergency
          </span>
        )}
      </div>

      {/* Distance + ETA + phone */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-xl font-extrabold text-[#0F3DDE]">
          {formatDistance(hospital.distanceKm)}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted">
          <Clock className="h-4 w-4 text-accent" /> {formatEta(hospital.etaMinutes)}
        </span>
        {hospital.phone && hospital.phone !== '108' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
            <Phone className="h-3 w-3" /> {hospital.phone}
          </span>
        )}
      </div>

      {/* Capacity tiles */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#E8EDF5] bg-[#F6F9FC] px-2 py-2 text-center">
            <s.icon className="mx-auto h-3.5 w-3.5 text-[#0F3DDE]" />
            <p className="mt-0.5 text-base font-extrabold leading-none text-primary">{s.value}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Departments */}
      {hospital.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {hospital.services.slice(0, 5).map((s) => (
            <span
              key={s}
              className="rounded-full bg-[#0F3DDE]/5 px-2 py-0.5 text-[10px] font-semibold text-[#0F3DDE]"
            >
              {s}
            </span>
          ))}
          {hospital.services.length > 5 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-muted">
              +{hospital.services.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <a
          href={`tel:${hospital.phone || '108'}`}
          onClick={(e) => e.stopPropagation()}
          className="ripple focus-ring col-span-1 inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-[#E53935] to-accent px-2 py-2.5 text-xs font-bold text-white shadow-md shadow-[#E53935]/25 transition hover:scale-[1.02]"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ripple focus-ring col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#0F3DDE] to-secondary px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-[#0F3DDE]/25 transition hover:scale-[1.02]"
        >
          <Navigation className="h-3.5 w-3.5" /> Directions
        </a>
        <button
          onClick={share}
          className="focus-ring inline-flex items-center justify-center gap-1 rounded-full border border-[#E8EDF5] bg-white px-2 py-2.5 text-xs font-bold text-primary transition hover:border-[#0F3DDE]/40"
          title="Share"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#16C784]" /> : <Share2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </motion.div>
  );
};

export default HospitalCard;

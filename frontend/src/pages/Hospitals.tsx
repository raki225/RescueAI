import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Hospital as HospitalIcon, Bookmark } from 'lucide-react';
import { HospitalMap } from '../components/maps/HospitalMap';
import { HospitalCard } from '../components/maps/HospitalCard';
import { HospitalFilters } from '../components/maps/HospitalFilters';
import { LocationBar } from '../components/maps/LocationBar';
import { Button } from '../components/common/Button';
import { useTriageStore } from '../store/triageStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { nearbyHospitals, reverseGeocode } from '../services/maps';
import { toApiError } from '../services/api/client';
import { GeoLocation, Hospital, LocationDetails } from '../types';
import { pageTransition } from '../utils/motion';

export const Hospitals = () => {
  const navigate = useNavigate();
  const {
    location,
    setLocation,
    locationDetails,
    setLocationDetails,
    selectedHospital,
    setSelectedHospital,
    savedHospitals,
    toggleSavedHospital,
  } = useTriageStore();
  const { requestLocation } = useGeolocation();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  const [ownership, setOwnership] = useState<'all' | 'government' | 'private'>('all');
  const [service, setService] = useState('all');
  const [radiusKm, setRadiusKm] = useState(10);
  const didInit = useRef(false);

  const load = useCallback(
    async (loc: GeoLocation, r: number, own: string, svc: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await nearbyHospitals({
          lat: loc.lat,
          lng: loc.lng,
          radiusKm: r,
          limit: 100,
          ownership: own as 'all' | 'government' | 'private',
          service: svc,
        });
        setHospitals(data);
      } catch (err) {
        setError(toApiError(err).message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /** Resolve GPS → reverse geocode → store + load. */
  const useGps = useCallback(async () => {
    setLocating(true);
    setLocError(null);
    try {
      const loc = await requestLocation();
      let details: LocationDetails | null = null;
      try {
        details = await reverseGeocode(loc.lat, loc.lng);
        details = { ...details, accuracyMeters: loc.accuracyMeters };
      } catch {
        /* reverse geocode optional */
      }
      const merged: GeoLocation = {
        ...loc,
        address: details?.formatted ?? 'Your location',
      };
      setLocation(merged);
      if (details) setLocationDetails(details);
      await load(merged, radiusKm, ownership, service);
    } catch (err) {
      setLocError((err as Error).message);
    } finally {
      setLocating(false);
    }
  }, [requestLocation, setLocation, setLocationDetails, load, radiusKm, ownership, service]);

  const selectPlace = useCallback(
    async (d: LocationDetails) => {
      const loc: GeoLocation = { lat: d.lat, lng: d.lng, address: d.formatted };
      setLocation(loc);
      setLocationDetails(d);
      setLocError(null);
      await load(loc, radiusKm, ownership, service);
    },
    [setLocation, setLocationDetails, load, radiusKm, ownership, service]
  );

  // On first mount: use persisted location, else try GPS automatically.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    if (location) load(location, radiusKm, ownership, service);
    else useGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when filters change (only if we have a location).
  useEffect(() => {
    if (!didInit.current || !location) return;
    load(location, radiusKm, ownership, service);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownership, service, radiusKm]);

  const savedIds = useMemo(() => new Set(savedHospitals.map((h) => h.id)), [savedHospitals]);
  const activeLoc = location;

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="app-container section-y"
    >
      {/* Header */}
      <div className="mb-4">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#0F3DDE]">
          🏥 India-wide Emergency Care
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
          Smart Hospital Locator
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Live Government &amp; Private hospitals near any location in India — GPS, PIN code, village,
          town, or city.
        </p>
      </div>

      {/* Location bar */}
      <div className="mb-4">
        <LocationBar
          details={locationDetails}
          loading={locating}
          error={locError}
          onUseGps={useGps}
          onSelectPlace={selectPlace}
        />
      </div>

      {/* Filters */}
      <div className="mb-5">
        <HospitalFilters
          ownership={ownership}
          onOwnership={setOwnership}
          service={service}
          onService={setService}
          radiusKm={radiusKm}
          onRadius={setRadiusKm}
        />
      </div>

      {/* Main grid: map + list */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Map card */}
        <div className="sticky top-24 h-fit rounded-[24px] border border-[#E8EDF5] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          {activeLoc ? (
            <>
              <div
                className={`overflow-hidden rounded-[18px] transition-all duration-500 ${
                  loading ? 'blur-sm brightness-95' : ''
                }`}
              >
                <HospitalMap
                  userLocation={activeLoc}
                  hospitals={hospitals}
                  selectedId={selectedHospital?.id}
                  onSelect={setSelectedHospital}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1E88E5]" /> Government
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E53935]" /> Private
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FB8C00]" /> Selected
                </span>
                <span className="font-semibold text-[#0F3DDE]">Within {radiusKm} km</span>
              </div>
            </>
          ) : (
            <div className="grid h-[380px] place-items-center rounded-[18px] bg-[#F6F9FC] text-center sm:h-[500px]">
              <div className="px-6">
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-[#0F3DDE]/10 text-3xl">
                  🗺️
                </div>
                <p className="font-bold text-primary">Set your location to see the map</p>
                <p className="mt-1 text-sm text-muted">
                  Allow GPS above, or search by PIN code, village, town or city.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-primary">
              <HospitalIcon className="h-5 w-5 text-[#0F3DDE]" /> Nearby Hospitals
            </h2>
            {!loading && activeLoc && (
              <span className="rounded-full bg-[#0F3DDE]/10 px-2.5 py-1 text-xs font-bold text-[#0F3DDE]">
                {hospitals.length} found
              </span>
            )}
          </div>

          {!activeLoc ? (
            <div className="rounded-[20px] border border-dashed border-[#0F3DDE]/20 bg-white p-8 text-center text-sm text-muted">
              Set your location to find nearby Government and Private hospitals.
            </div>
          ) : loading ? (
            <SkeletonList />
          ) : error ? (
            <div className="rounded-[20px] border border-[#E8EDF5] bg-white p-6 text-center text-sm text-muted">
              {error}
              <button
                onClick={() => activeLoc && load(activeLoc, radiusKm, ownership, service)}
                className="mt-3 block w-full rounded-full bg-[#0F3DDE] px-4 py-2 font-bold text-white"
              >
                Retry
              </button>
            </div>
          ) : hospitals.length === 0 ? (
            <EmptyState
              onExpand={() => setRadiusKm((r) => Math.min(r * 2, 100))}
              canExpand={radiusKm < 100}
              onReset={() => {
                setOwnership('all');
                setService('all');
              }}
            />
          ) : (
            <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
              {hospitals.map((h) => (
                <HospitalCard
                  key={h.id}
                  hospital={h}
                  selected={selectedHospital?.id === h.id}
                  saved={savedIds.has(h.id)}
                  onSelect={setSelectedHospital}
                  onToggleSave={toggleSavedHospital}
                />
              ))}
            </div>
          )}

          {savedHospitals.length > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Bookmark className="h-3.5 w-3.5 fill-current text-[#0F3DDE]" />
              {savedHospitals.length} saved
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="safe" icon={<FileText className="h-5 w-5" />} onClick={() => navigate('/report')}>
          Continue to Emergency Report
        </Button>
      </div>
    </motion.div>
  );
};

const SkeletonList = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="relative overflow-hidden rounded-[20px] border border-[#E8EDF5] bg-white p-4">
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-5 w-12 rounded-full bg-slate-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-slate-200" />
            <div className="h-6 w-24 rounded-full bg-slate-200" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-12 rounded-2xl bg-slate-100" />
            ))}
          </div>
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded-full bg-slate-200" />
            <div className="h-9 flex-1 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="animate-shimmer pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
    ))}
  </div>
);

const EmptyState = ({
  onExpand,
  canExpand,
  onReset,
}: {
  onExpand: () => void;
  canExpand: boolean;
  onReset: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#0F3DDE]/20 bg-white px-6 py-12 text-center"
  >
    <div className="relative mb-4">
      <div className="grid h-24 w-24 place-items-center rounded-full bg-[#0F3DDE]/10">
        <span className="text-5xl">🏥</span>
      </div>
      <span className="absolute -right-1 -top-1 animate-bounce-subtle text-2xl">🔍</span>
    </div>
    <h3 className="text-lg font-extrabold text-primary">No hospitals found here</h3>
    <p className="mt-1 max-w-xs text-sm text-muted">
      Nothing matched your filters within this radius. Try widening the search or clearing filters.
    </p>
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {canExpand && (
        <button
          onClick={onExpand}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0F3DDE] to-secondary px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0F3DDE]/25 transition hover:scale-[1.02]"
        >
          Expand radius
        </button>
      )}
      <button
        onClick={onReset}
        className="focus-ring rounded-full border border-[#E8EDF5] bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-[#0F3DDE]/40"
      >
        Clear filters
      </button>
    </div>
  </motion.div>
);

export default Hospitals;

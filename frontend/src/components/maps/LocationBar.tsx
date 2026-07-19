import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, LocateFixed, Loader2, Navigation2, X } from 'lucide-react';
import { LocationDetails } from '../../types';
import {
  autocomplete,
  resolvePrediction,
  isGoogleMapsConfigured,
  PlacePrediction,
} from '../../services/maps';

interface LocationBarProps {
  details: LocationDetails | null;
  loading: boolean;
  error: string | null;
  onUseGps: () => void;
  onSelectPlace: (d: LocationDetails) => void;
}

/**
 * Live location header + manual search. No city is ever assumed — if GPS fails
 * the user searches by PIN code, village, town, city, district or landmark.
 */
export const LocationBar = ({
  details,
  loading,
  error,
  onUseGps,
  onSelectPlace,
}: LocationBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<number>();

  const fetchSuggestions = async (q: string) => {
    setSearching(true);
    setSearchError(null);
    try {
      const res = await autocomplete(q);
      if (res.length === 0) {
        setSearchError('No matching place found. Try a PIN code or nearby town.');
      }
      setResults(res);
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // With a Google Maps key, suggest live as the user types (debounced). Without
  // a key we search on submit only, to stay gentle on the OpenStreetMap engine.
  useEffect(() => {
    if (!isGoogleMapsConfigured()) return;
    const q = query.trim();
    window.clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    debounceRef.current = window.setTimeout(() => fetchSuggestions(q), 300);
    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setResults([]);
    await fetchSuggestions(q);
  };

  const pick = async (prediction: PlacePrediction) => {
    setSearching(true);
    try {
      const details = await resolvePrediction(prediction);
      if (details) {
        onSelectPlace(details);
        setResults([]);
        setQuery('');
        setSearchError(null);
      } else {
        setSearchError('Could not open that place. Try another result.');
      }
    } catch {
      setSearchError('Could not open that place. Try another result.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="rounded-[22px] border border-[#E8EDF5] bg-white/85 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Resolved location */}
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[#0F3DDE]/10 text-xl">
            📍
          </span>
          <div className="min-w-0">
            {loading ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Detecting your location…
              </p>
            ) : details ? (
              <>
                <p className="truncate text-sm font-extrabold text-primary">
                  {details.area}
                  {details.city && details.city !== details.area ? `, ${details.city}` : ''}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-muted">
                  {details.district && <span>{details.district}</span>}
                  {details.state && <span>· {details.state}</span>}
                  {details.pincode && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-primary">
                      PIN {details.pincode}
                    </span>
                  )}
                  {typeof details.accuracyMeters === 'number' && (
                    <span
                      className={`inline-flex items-center gap-1 ${
                        details.accuracyMeters <= 200
                          ? 'text-[#16C784]'
                          : details.accuracyMeters <= 1500
                            ? 'text-amber-600'
                            : 'text-danger'
                      }`}
                    >
                      <Navigation2 className="h-3 w-3" />
                      {details.accuracyMeters >= 1000
                        ? `±${(details.accuracyMeters / 1000).toFixed(1)} km`
                        : `±${details.accuracyMeters} m`}
                      {details.accuracyMeters > 200 ? ' · approx.' : ''}
                    </span>
                  )}
                </p>
                {typeof details.accuracyMeters === 'number' && details.accuracyMeters > 500 && (
                  <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium leading-snug text-amber-800">
                    <span className="mt-px">⚠</span>
                    <span>
                      This looks approximate. If it isn’t your area, search your{' '}
                      <strong>PIN code or locality</strong> above to correct it.
                    </span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-extrabold text-primary">Location not set</p>
                <p className="text-[11px] font-medium text-muted">
                  {error ?? 'Use GPS or search by PIN / area / city.'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Search + GPS */}
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="PIN code, village, town, city…"
              className="focus-ring h-11 w-full rounded-xl border border-[#E8EDF5] bg-white pl-9 pr-9 text-sm font-medium text-ink outline-none transition focus:border-[#0F3DDE]"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setSearchError(null);
                }}
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-slate-100"
                aria-label="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={runSearch}
            disabled={searching}
            className="focus-ring grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0F3DDE] to-secondary text-white shadow-md disabled:opacity-60"
            title="Search"
          >
            {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </button>
          <button
            onClick={onUseGps}
            disabled={loading}
            className="focus-ring inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-xl border border-[#0F3DDE]/30 bg-[#0F3DDE]/5 px-3 font-semibold text-[#0F3DDE] transition hover:border-[#0F3DDE]/50 hover:bg-[#0F3DDE]/10 disabled:opacity-60"
            title="Use my current location"
            aria-label="Use my current location"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LocateFixed className="h-5 w-5" />
            )}
            <span className="hidden text-sm sm:inline">{loading ? 'Locating…' : 'Locate me'}</span>
          </button>
        </div>
      </div>

      {/* Search results */}
      <AnimatePresence>
        {(results.length > 0 || searchError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            {searchError ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {searchError}
              </p>
            ) : (
              <ul className="space-y-1">
                {results.map((r, i) => (
                  <li key={`${r.placeId ?? r.description}-${i}`}>
                    <button
                      onClick={() => pick(r)}
                      className="focus-ring flex w-full items-start gap-2 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-[#0F3DDE]/20 hover:bg-[#0F3DDE]/5"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0F3DDE]" />
                      <span className="text-sm text-ink">{r.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationBar;

import { useCallback, useState } from 'react';
import { GeoLocation } from '../types';

interface GeolocationState {
  location: GeoLocation | null;
  loading: boolean;
  error: string | null;
  denied: boolean;
}

/**
 * Requests the browser geolocation. There is NO hardcoded fallback location —
 * if GPS is unavailable the promise rejects so the UI can offer manual search
 * (PIN code / area / village / city) instead of defaulting to any city.
 */
export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    denied: false,
  });

  const requestLocation = useCallback((): Promise<GeoLocation> => {
    return new Promise((resolve, reject) => {
      setState((s) => ({ ...s, loading: true, error: null }));

      if (!('geolocation' in navigator)) {
        const msg = 'Geolocation is not supported by this browser.';
        setState({ location: null, loading: false, error: msg, denied: true });
        reject(new Error(msg));
        return;
      }

      const onSuccess = (pos: GeolocationPosition) => {
        const loc: GeoLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
        };
        setState({ location: loc, loading: false, error: null, denied: false });
        resolve(loc);
      };

      const fail = (denied: boolean) => {
        const msg = denied
          ? 'Location access denied. Enable it in your browser, or search by PIN code, area, or city.'
          : 'Could not get your location. Search by PIN code, area, or city instead.';
        setState({ location: null, loading: false, error: msg, denied });
        reject(new Error(msg));
      };

      // First attempt: high accuracy (GPS). If it times out or the position is
      // unavailable (common on laptops/desktops without GPS), retry once with
      // low accuracy and a longer timeout so "locate" still succeeds.
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            fail(true);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            (err2) => fail(err2.code === err2.PERMISSION_DENIED),
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }, []);

  return { ...state, requestLocation };
};

export default useGeolocation;

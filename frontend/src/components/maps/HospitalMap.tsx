import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { LocateFixed, Layers, Navigation, Maximize } from 'lucide-react';
import { GeoLocation, Hospital } from '../../types';
import { formatDistance, formatEta } from '../../utils/formatters';
import { getDirectionsUrl } from '../../services/maps';

interface HospitalMapProps {
  userLocation: GeoLocation;
  hospitals: Hospital[];
  selectedId?: string | null;
  onSelect?: (hospital: Hospital) => void;
}

// Animated, pulsing "live location" marker (styles live in globals.css).
const userIcon = L.divIcon({
  className: '',
  html: `<div class="user-pulse"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const hospitalIcon = (selected: boolean, ownership: string) => {
  // Selected = orange, Government = blue, Private = red.
  const color = selected ? '#FB8C00' : ownership === 'government' ? '#1E88E5' : '#E53935';
  const size = selected ? 34 : 30;
  return L.divIcon({
    className: '',
    html: `<div class="hospital-pin ${selected ? 'hospital-pin--selected' : ''}" style="transform:translate(-50%,-100%);">
      <div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${color};border:2px solid #fff;
        box-shadow:0 4px 12px rgba(0,0,0,0.3);display:grid;place-items:center;">
        <span style="transform:rotate(45deg);color:#fff;font-size:14px;font-weight:700;">+</span>
      </div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [0, 0],
  });
};

// Branded cluster bubble.
const createClusterIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div style="display:grid;place-items:center;width:44px;height:44px;border-radius:50%;
      background:linear-gradient(135deg,#0F3DDE,#1E88E5);color:#fff;font-weight:800;font-size:14px;
      border:3px solid #fff;box-shadow:0 6px 18px rgba(15,61,222,0.4);">${count}</div>`,
    className: '',
    iconSize: L.point(44, 44, true),
  });
};

/** Re-fit the map to include the user and all hospital markers. */
const FitBounds = ({ user, hospitals }: { user: GeoLocation; hospitals: Hospital[] }) => {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [
      [user.lat, user.lng],
      ...hospitals.map((h) => [h.lat, h.lng] as [number, number]),
    ];
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points).pad(0.2), { animate: true });
    } else {
      map.setView([user.lat, user.lng], 13);
    }
  }, [user, hospitals, map]);
  return null;
};

/** Smoothly pan/zoom toward the selected hospital when one is picked. */
const FlyToSelected = ({ user, hospital }: { user: GeoLocation; hospital?: Hospital | null }) => {
  const map = useMap();
  useEffect(() => {
    if (!hospital) return;
    map.flyToBounds(
      L.latLngBounds([
        [user.lat, user.lng],
        [hospital.lat, hospital.lng],
      ]).pad(0.35),
      { animate: true, duration: 0.8 }
    );
  }, [hospital, user, map]);
  return null;
};

interface OverlaysProps {
  user: GeoLocation;
  hospitals: Hospital[];
  selected: Hospital | null;
  satellite: boolean;
  onToggleSatellite: () => void;
}

/** Live-GPS chip + mini glass toolbar rendered over the map. */
const MapOverlays = ({ user, hospitals, selected, satellite, onToggleSatellite }: OverlaysProps) => {
  const map = useMap();

  const flyToUser = () => map.flyTo([user.lat, user.lng], 14, { duration: 0.8 });
  const resetView = () => {
    const points: [number, number][] = [
      [user.lat, user.lng],
      ...hospitals.map((h) => [h.lat, h.lng] as [number, number]),
    ];
    if (points.length > 1) map.flyToBounds(L.latLngBounds(points).pad(0.2), { duration: 0.8 });
    else map.flyTo([user.lat, user.lng], 13);
  };
  const openDirections = () => {
    const dest = selected ?? hospitals[0];
    if (!dest) return;
    window.open(
      getDirectionsUrl({ lat: dest.lat, lng: dest.lng }, { lat: user.lat, lng: user.lng }),
      '_blank',
      'noopener,noreferrer'
    );
  };

  const btn =
    'grid h-9 w-9 place-items-center rounded-xl text-primary transition hover:bg-[#0F3DDE]/10 hover:text-[#0F3DDE]';

  return (
    <>
      {/* Live GPS chip — top left */}
      <div
        ref={(el) => el && L.DomEvent.disableClickPropagation(el)}
        className="pointer-events-auto absolute left-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/85 px-3 py-1.5 text-xs font-bold text-primary shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16C784] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#16C784]" />
        </span>
        Live GPS
      </div>

      {/* Mini toolbar — top right */}
      <div
        ref={(el) => el && L.DomEvent.disableClickPropagation(el)}
        className="pointer-events-auto absolute right-3 top-3 z-[1000] flex items-center gap-1 rounded-2xl border border-white/60 bg-white/85 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur"
      >
        <button onClick={flyToUser} title="My location" className={btn}>
          <LocateFixed className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={onToggleSatellite}
          title="Toggle satellite"
          className={`${btn} ${satellite ? 'bg-[#0F3DDE]/10 text-[#0F3DDE]' : ''}`}
        >
          <Layers className="h-[18px] w-[18px]" />
        </button>
        <button onClick={openDirections} title="Directions" className={btn}>
          <Navigation className="h-[18px] w-[18px]" />
        </button>
        <button onClick={resetView} title="Reset view" className={btn}>
          <Maximize className="h-[18px] w-[18px]" />
        </button>
      </div>
    </>
  );
};

export const HospitalMap = ({ userLocation, hospitals, selectedId, onSelect }: HospitalMapProps) => {
  const [satellite, setSatellite] = useState(false);
  const selected = hospitals.find((h) => h.id === selectedId) ?? null;

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={12}
      scrollWheelZoom
      zoomControl={false}
      zoomAnimation
      className="h-[380px] w-full rounded-[18px] sm:h-[600px]"
    >
      {satellite ? (
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
      )}

      <FitBounds user={userLocation} hospitals={hospitals} />
      <FlyToSelected user={userLocation} hospital={selected} />
      <MapOverlays
        user={userLocation}
        hospitals={hospitals}
        selected={selected}
        satellite={satellite}
        onToggleSatellite={() => setSatellite((v) => !v)}
      />

      {/* Route line from user to the selected hospital */}
      {selected && (
        <Polyline
          positions={[
            [userLocation.lat, userLocation.lng],
            [selected.lat, selected.lng],
          ]}
          pathOptions={{ color: '#E53935', weight: 4, opacity: 0.75, dashArray: '2 10' }}
        />
      )}

      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>

      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={50}
        iconCreateFunction={createClusterIcon}
      >
        {hospitals.map((h) => (
          <Marker
            key={h.id}
            position={[h.lat, h.lng]}
            icon={hospitalIcon(h.id === selectedId, h.ownership)}
            eventHandlers={{ click: () => onSelect?.(h) }}
          >
            <Popup>
              <strong>{h.name}</strong>
              <br />
              {h.ownership === 'government' ? '🏛️ Government' : '🏢 Private'} ·{' '}
              {formatDistance(h.distanceKm)} · ~{formatEta(h.etaMinutes)}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default HospitalMap;

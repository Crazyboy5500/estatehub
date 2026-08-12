import { useEffect, useRef, useState } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { useTranslation } from 'react-i18next';

interface NearbyLayer {
  key: keyof typeof NEARBY_LABEL_KEY;
  label: string;
  emoji: string;
  color: string;
  query: string;
}

const NEARBY_LABEL_KEY = {
  school: 'nearby.schools',
  hospital: 'nearby.hospitals',
  metro: 'nearby.metro',
  park: 'nearby.parks',
} as const;

interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dist: number;
}

interface OverpassElement {
  id: number | string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: { name?: string };
}

const LAYERS: NearbyLayer[] = [
  { key: 'school', label: 'Schools', emoji: '🏫', color: '#2563eb', query: '["amenity"="school"]' },
  { key: 'hospital', label: 'Hospitals', emoji: '🏥', color: '#dc2626', query: '["amenity"~"hospital|clinic|doctors"]' },
  { key: 'metro', label: 'Metro', emoji: '🚇', color: '#7c3aed', query: '["railway"="station"]' },
  { key: 'park', label: 'Parks', emoji: '🌳', color: '#16a34a', query: '["leisure"="park"]' },
];

const RADIUS_M = 2000;

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3;
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fetchNearby = async (key: string, lat: number, lng: number): Promise<NearbyPlace[]> => {
  const conf = LAYERS.find((l) => l.key === key) as NearbyLayer;
  const query = `[out:json][timeout:15];(node${conf.query}(around:${RADIUS_M},${lat},${lng});way${conf.query}(around:${RADIUS_M},${lat},${lng}););out center 50;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error('Overpass request failed');
  const json = await res.json();
  return (json.elements || [])
    .map((el: OverpassElement) => ({
      id: `${el.id}`,
      name: el.tags?.name || conf.label,
      lat: el.lat ?? el.center?.lat ?? 0,
      lng: el.lon ?? el.center?.lon ?? 0,
      dist: 0,
    }))
    .filter((p: NearbyPlace) => p.lat && p.lng)
    .slice(0, 25);
};

export default function NearbyPlaces({ lat, lng }: { lat: number; lng: number }) {
  const [active, setActive] = useState<string[]>([]);
  const [places, setPlaces] = useState<Record<string, NearbyPlace[]>>({});
  const [loadingKey, setLoadingKey] = useState('');
  const [error, setError] = useState('');
  const cacheRef = useRef<Record<string, NearbyPlace[]>>({});
  const { t } = useTranslation();

  useEffect(() => {
    cacheRef.current = {};
    setPlaces({});
  }, [lat, lng]);

  const toggle = async (layer: NearbyLayer): Promise<void> => {
    if (active.includes(layer.key)) {
      setActive((prev) => prev.filter((k) => k !== layer.key));
      return;
    }
    setActive((prev) => [...prev, layer.key]);
    if (cacheRef.current[layer.key]) {
      setPlaces((prev) => ({ ...prev, [layer.key]: cacheRef.current[layer.key] }));
      return;
    }
    setLoadingKey(layer.key);
    setError('');
    try {
      const list = (await fetchNearby(layer.key, lat, lng)).map((p) => ({
        ...p,
        dist: Math.round(haversine(lat, lng, p.lat, p.lng) / 10) / 100,
      }));
      cacheRef.current[layer.key] = list;
      setPlaces((prev) => ({ ...prev, [layer.key]: list }));
    } catch {
      setError(t('nearby.loadError'));
    } finally {
      setLoadingKey('');
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">{t('detail.nearByLabel')}</span>
        {LAYERS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => void toggle(l)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
              active.includes(l.key)
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
            style={active.includes(l.key) ? { backgroundColor: l.color } : undefined}
          >
                        {l.emoji} {t(NEARBY_LABEL_KEY[l.key])}
            {loadingKey === l.key && <span className="ml-1 animate-pulse">…</span>}
          </button>
        ))}
      </div>
      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      {LAYERS.filter((l) => active.includes(l.key)).map((l) =>
        (places[l.key] || []).map((p) => (
          <CircleMarker
            key={`${l.key}-${p.id}`}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{ color: '#fff', weight: 1.5, fillColor: l.color, fillOpacity: 0.9 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="text-xs font-semibold">
                {l.emoji} {p.name} · {p.dist.toFixed(2)} km
              </span>
            </Tooltip>
          </CircleMarker>
        ))
      )}
    </div>
  );
}
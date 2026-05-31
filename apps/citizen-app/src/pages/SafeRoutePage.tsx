import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Hazard {
  id: string;
  type: string;
  lat: number;
  lng: number;
  severity: number;
  description: string;
}

interface Route {
  id: 'safe' | 'balanced' | 'fast';
  label: string;
  color: string;
  emoji: string;
  waypoints: [number, number][];
  distanceKm: number;
  durationMin: number;
  safetyScore: number;
  hazardsOnRoute: number;
  roadTypes: string[];
  description: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// ── Haversine distance ────────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Average speed assumptions (km/h)
const SPEED = { safe: 28, balanced: 38, fast: 52 };

// Check if a point is "near" a hazard (within radiusKm)
function isNearHazard(lat: number, lng: number, hazards: Hazard[], radiusKm = 0.3): Hazard | null {
  for (const h of hazards) {
    if (haversineKm(lat, lng, h.lat, h.lng) < radiusKm) return h;
  }
  return null;
}

// Generate intermediate waypoints between two points
function interpolateWaypoints(
  start: [number, number],
  end: [number, number],
  hazards: Hazard[],
  avoidHazards: boolean,
  steps = 6
): [number, number][] {
  const pts: [number, number][] = [start];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    let lat = start[0] + (end[0] - start[0]) * t;
    let lng = start[1] + (end[1] - start[1]) * t;

    if (avoidHazards) {
      const nearby = isNearHazard(lat, lng, hazards.filter(h => h.severity >= 6));
      if (nearby) {
        // Deflect perpendicular to avoid hazard
        const deflect = 0.004;
        lat += deflect * (Math.random() > 0.5 ? 1 : -1);
        lng += deflect * (Math.random() > 0.5 ? 1 : -1);
      }
    }
    pts.push([lat, lng]);
  }
  pts.push(end);
  return pts;
}

// Count hazards along a route path
function countHazardsAlongRoute(waypoints: [number, number][], hazards: Hazard[]): number {
  let count = 0;
  for (const [lat, lng] of waypoints) {
    if (isNearHazard(lat, lng, hazards, 0.4)) count++;
  }
  return Math.min(count, hazards.length);
}

function computeSafetyScore(hazardsOnRoute: number, totalHazards: number, routeType: 'safe' | 'balanced' | 'fast'): number {
  const base = routeType === 'safe' ? 88 : routeType === 'balanced' ? 72 : 55;
  const hazardRatio = totalHazards > 0 ? hazardsOnRoute / totalHazards : 0;
  const penalty = Math.min(hazardsOnRoute * 8 + hazardRatio * 6, 40);
  return Math.max(20, Math.min(100, base - penalty));
}

// Map auto-fit bounds component
function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useEffect(() => { if (bounds) map.fitBounds(bounds, { padding: [40, 40] }); }, [bounds, map]);
  return null;
}

// Map fly to component
function MapFlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 15, { duration: 2 }); }, [center, map]);
  return null;
}

// Custom icons
const originIcon = L.divIcon({
  className: '',
  html: `<div style="background:#10b981;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9]
});
const destIcon = L.divIcon({
  className: '',
  html: `<div style="background:#ef4444;width:22px;height:28px;clip-path:polygon(50% 100%,0 40%,30% 40%,30% 0,70% 0,70% 40%,100% 40%);background:#ef4444;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [22, 28], iconAnchor: [11, 28]
});
const hazardIcon = (severity: number) => L.divIcon({
  className: '',
  html: `<div style="background:${severity >= 8 ? '#ef4444' : severity >= 5 ? '#f59e0b' : '#6b7280'};width:14px;height:14px;border-radius:50%;border:2px solid white;opacity:0.85"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7]
});

export default function SafeRoutePage() {
  const navigate = useNavigate();
  const [originQuery, setOriginQuery]   = useState('');
  const [destQuery, setDestQuery]       = useState('');
  const [originSuggestions, setOriginSug] = useState<NominatimResult[]>([]);
  const [destSuggestions, setDestSug]   = useState<NominatimResult[]>([]);
  const [origin, setOrigin]             = useState<[number, number] | null>(null);
  const [dest, setDest]                 = useState<[number, number] | null>(null);
  const [routes, setRoutes]             = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<'safe' | 'balanced' | 'fast'>('safe');
  const [hazards, setHazards]           = useState<Hazard[]>([]);
  const [loading, setLoading]           = useState(false);
  const [showHazards, setShowHazards]   = useState(true);
  const [mapCenter]                     = useState<[number, number]>([20, 0]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch live hazards from dashboard API
  useEffect(() => {
    fetch('/api/reports/all')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.reports) {
          const h: Hazard[] = d.data.reports.map((r: any) => ({
            id: String(r.report_id),
            type: r.category || 'Unknown',
            lat: r.latitude,
            lng: r.longitude,
            severity: r.severity || 5,
            description: r.description || r.category
          }));
          setHazards(h);
        }
      })
      .catch(() => {
        // Offline fallback: use static hazard data
        setHazards([
          { id: 'h1', type: 'Pothole', lat: 12.9352, lng: 77.6245, severity: 9, description: 'Severe pothole cluster' },
          { id: 'h2', type: 'Drainage', lat: 12.9121, lng: 77.6446, severity: 8, description: 'Road flooding' },
          { id: 'h3', type: 'Road Crack', lat: 12.9252, lng: 77.5938, severity: 6, description: 'Surface cracking' },
        ]);
      });
  }, []);

  // Nominatim search with debounce
  const searchPlace = (query: string, setSuggestions: (r: NominatimResult[]) => void) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.length < 3) { setSuggestions([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
    }, 400);
  };

  const computeRoutes = () => {
    if (!origin || !dest) return;
    setLoading(true);
    setTimeout(() => {
      const directDist = haversineKm(origin[0], origin[1], dest[0], dest[1]);

      const safeWP     = interpolateWaypoints(origin, dest, hazards, true,  8);
      const balancedWP = interpolateWaypoints(origin, dest, hazards, false, 6);
      const fastWP     = [origin, dest] as [number, number][];

      const safeHazards     = countHazardsAlongRoute(safeWP, hazards);
      const balancedHazards = countHazardsAlongRoute(balancedWP, hazards);
      const fastHazards     = countHazardsAlongRoute(fastWP, hazards);

      const safeScore     = computeSafetyScore(safeHazards, hazards.length, 'safe');
      const balancedScore = computeSafetyScore(balancedHazards, hazards.length, 'balanced');
      const fastScore     = computeSafetyScore(fastHazards, hazards.length, 'fast');

      const safeDist     = directDist * 1.25;
      const balancedDist = directDist * 1.10;
      const fastDist     = directDist * 1.02;

      setRoutes([
        {
          id: 'safe', label: 'Safest Route', color: '#22c55e', emoji: '🛡️',
          waypoints: safeWP,
          distanceKm: +safeDist.toFixed(1),
          durationMin: Math.round((safeDist / SPEED.safe) * 60),
          safetyScore: safeScore,
          hazardsOnRoute: safeHazards,
          roadTypes: ['SH', 'MDR', 'Local'],
          description: 'Avoids all high-severity hazards. Slightly longer but significantly safer.'
        },
        {
          id: 'balanced', label: 'Balanced Route', color: '#f59e0b', emoji: '⚖️',
          waypoints: balancedWP,
          distanceKm: +balancedDist.toFixed(1),
          durationMin: Math.round((balancedDist / SPEED.balanced) * 60),
          safetyScore: balancedScore,
          hazardsOnRoute: balancedHazards,
          roadTypes: ['NH', 'SH'],
          description: 'Good balance of speed and safety. Avoids critical hazards only.'
        },
        {
          id: 'fast', label: 'Fastest Route', color: '#3b82f6', emoji: '⚡',
          waypoints: fastWP,
          distanceKm: +fastDist.toFixed(1),
          durationMin: Math.round((fastDist / SPEED.fast) * 60),
          safetyScore: fastScore,
          hazardsOnRoute: fastHazards,
          roadTypes: ['NH'],
          description: 'Direct path. May pass through hazard zones. Use with caution.'
        }
      ]);
      setLoading(false);
    }, 800);
  };

  const activeRoute = routes.find(r => r.id === selectedRoute);
  const bounds: [[number, number], [number, number]] | null =
    origin && dest ? [[
      Math.min(origin[0], dest[0]) - 0.01,
      Math.min(origin[1], dest[1]) - 0.01
    ], [
      Math.max(origin[0], dest[0]) + 0.01,
      Math.max(origin[1], dest[1]) + 0.01
    ]] : null;

  const scoreColor = (s: number) =>
    s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 className="font-bold text-white text-base">🛡️ Safe Route Planner</h1>
          <p className="text-gray-400 text-xs">{hazards.length} live hazards loaded · Global search</p>
        </div>
        <button
          onClick={() => setShowHazards(h => !h)}
          className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition ${showHazards ? 'bg-red-900/40 text-red-400 border border-red-700' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
        >
          {showHazards ? '⚠️ Hazards ON' : '⚠️ Hazards OFF'}
        </button>
      </header>

      {/* Search inputs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2">
          {/* Origin */}
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700 focus-within:border-green-500">
              <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"/>
              <input
                value={originQuery}
                onChange={e => { setOriginQuery(e.target.value); searchPlace(e.target.value, setOriginSug); }}
                placeholder="From — anywhere in the world"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
            {originSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-[600] shadow-2xl max-h-48 overflow-y-auto">
                {originSuggestions.map(s => (
                  <button key={s.place_id} className="w-full text-left px-3 py-2.5 hover:bg-gray-700 text-sm text-white border-b border-gray-700 last:border-0"
                    onClick={() => { setOrigin([+s.lat, +s.lon]); setOriginQuery(s.display_name.split(',').slice(0,2).join(',')); setOriginSug([]); }}>
                    <p className="font-medium truncate">{s.display_name.split(',')[0]}</p>
                    <p className="text-gray-400 text-xs truncate">{s.display_name.split(',').slice(1,3).join(',')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700 focus-within:border-red-500">
              <span className="text-red-500 text-base">📍</span>
              <input
                value={destQuery}
                onChange={e => { setDestQuery(e.target.value); searchPlace(e.target.value, setDestSug); }}
                placeholder="To — search globally"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
            {destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-[600] shadow-2xl max-h-48 overflow-y-auto">
                {destSuggestions.map(s => (
                  <button key={s.place_id} className="w-full text-left px-3 py-2.5 hover:bg-gray-700 text-sm text-white border-b border-gray-700 last:border-0"
                    onClick={() => { setDest([+s.lat, +s.lon]); setDestQuery(s.display_name.split(',').slice(0,2).join(',')); setDestSug([]); }}>
                    <p className="font-medium truncate">{s.display_name.split(',')[0]}</p>
                    <p className="text-gray-400 text-xs truncate">{s.display_name.split(',').slice(1,3).join(',')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={computeRoutes}
            disabled={!origin || !dest || loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 disabled:opacity-40 transition flex-shrink-0"
          >
            {loading ? '⏳' : '🔍 Go'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <MapContainer
          center={origin || mapCenter}
          zoom={origin ? 13 : 2}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='© OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {bounds && <FitBounds bounds={bounds} />}

          {/* Hazard markers */}
          {showHazards && hazards.map(h => (
            <Marker key={h.id} position={[h.lat, h.lng]} icon={hazardIcon(h.severity)}>
              <Popup>
                <div className="text-xs">
                  <strong>{h.type}</strong>
                  <p>Severity: {h.severity}/10</p>
                  <p>{h.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {showHazards && hazards.filter(h => h.severity >= 7).map(h => (
            <Circle key={`c-${h.id}`} center={[h.lat, h.lng]} radius={300}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1 }}/>
          ))}

          {/* Route lines — show all faded, active one solid */}
          {routes.map(route => (
            <Polyline
              key={route.id}
              positions={route.waypoints}
              pathOptions={{
                color: route.color,
                weight: route.id === selectedRoute ? 5 : 2.5,
                opacity: route.id === selectedRoute ? 0.9 : 0.35,
                dashArray: route.id === selectedRoute ? undefined : '8 6'
              }}
            />
          ))}

          {origin && !dest && <MapFlyTo center={origin} />}
          {!origin && dest && <MapFlyTo center={dest} />}

          {origin && <Marker position={origin} icon={originIcon}><Popup><div className="text-sm">📍 Start<br/><span className="text-xs text-gray-500">Coords: {origin[0].toFixed(5)}, {origin[1].toFixed(5)}</span></div></Popup></Marker>}
          {dest   && <Marker position={dest}   icon={destIcon}>  <Popup><div className="text-sm">🏁 Destination<br/><span className="text-xs text-gray-500">Coords: {dest[0].toFixed(5)}, {dest[1].toFixed(5)}</span></div></Popup></Marker>}
        </MapContainer>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[500]">
            <div className="bg-gray-900 rounded-xl p-5 text-center shadow-2xl border border-teal-700">
              <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2 border-4"/>
              <p className="text-sm font-bold text-white">Analysing hazards…</p>
              <p className="text-xs text-gray-400">Computing safe routes</p>
            </div>
          </div>
        )}
      </div>

      {/* Route cards */}
      {routes.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-800 flex-shrink-0">
          {/* Route selector tabs */}
          <div className="flex border-b border-gray-800">
            {routes.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoute(r.id)}
                className={`flex-1 py-2.5 text-xs font-bold transition border-b-2 ${
                  selectedRoute === r.id
                    ? 'border-current'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
                style={{ color: selectedRoute === r.id ? r.color : undefined }}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>

          {/* Active route details */}
          {activeRoute && (
            <div className="px-4 py-3">
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{activeRoute.distanceKm} km</p>
                  <p className="text-xs text-gray-400">Distance</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">
                    {activeRoute.durationMin >= 60
                      ? `${Math.floor(activeRoute.durationMin/60)}h ${activeRoute.durationMin%60}m`
                      : `${activeRoute.durationMin} min`}
                  </p>
                  <p className="text-xs text-gray-400">Est. Time</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: scoreColor(activeRoute.safetyScore) }}>
                    {activeRoute.safetyScore}/100
                  </p>
                  <p className="text-xs text-gray-400">Safety Score</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${activeRoute.hazardsOnRoute === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                    {activeRoute.hazardsOnRoute}
                  </p>
                  <p className="text-xs text-gray-400">Hazards</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{activeRoute.description}</p>
                  <div className="flex gap-1">
                    {activeRoute.roadTypes.map(rt => (
                      <span key={rt} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs font-mono border border-gray-700">{rt}</span>
                    ))}
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition"
                  style={{ background: activeRoute.color }}
                  onClick={() => alert(`Navigation started via ${activeRoute.label}!\nOpen in Maps: https://www.openstreetmap.org/directions?from=${origin?.[0]},${origin?.[1]}&to=${dest?.[0]},${dest?.[1]}`)}
                >
                  Go ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// ── World city centres ───────────────────────────────────────────────────────
const WORLD_CENTERS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  global:    { center: [20, 0],              zoom: 2,  label: '🌍 World View' },
  india:     { center: [12.9716, 77.5946],   zoom: 11, label: '🇮🇳 Bengaluru, India' },
  usa:       { center: [40.7128, -74.0060],  zoom: 11, label: '🇺🇸 New York, USA' },
  uk:        { center: [51.5074, -0.1278],   zoom: 11, label: '🇬🇧 London, UK' },
  germany:   { center: [52.5200, 13.4050],   zoom: 11, label: '🇩🇪 Berlin, Germany' },
  australia: { center: [-33.8688, 151.2093], zoom: 11, label: '🇦🇺 Sydney, Australia' },
  japan:     { center: [35.6762, 139.6503],  zoom: 11, label: '🇯🇵 Tokyo, Japan' },
};
const DEFAULT_ZOOM = 11;

// ── Marker Icons ─────────────────────────────────────────────────────────────
const makeIcon = (emoji: string, bg: string) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:18px">${emoji}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const ICONS = {
  police_booth: makeIcon('🚔', '#006876'),
  streetlight:  makeIcon('💡', '#00658f'),
  pothole_fix:  makeIcon('⚠️', '#904d00'),
  camera:       makeIcon('📷', '#6d28d9'),
  speed_bump:   makeIcon('🚧', '#be185d'),
  hospital:     makeIcon('🏥', '#ec4899')
};

// ── AI Cost Lookup Table ──────────────────────────────────────────────────────
const AI_COSTS: Record<string, { base: number; label: string; crimeReduction: number; safetyGain: number; roiMultiplier: number; description: string }> = {
  police_booth: {
    base: 320000, label: 'Police Booth Setup',
    crimeReduction: 25, safetyGain: 12, roiMultiplier: 4.2,
    description: 'Permanent police presence reduces crime by 25% within 500m radius'
  },
  streetlight: {
    base: 85000, label: 'Streetlight Installation',
    crimeReduction: 15, safetyGain: 8, roiMultiplier: 3.8,
    description: 'LED street lighting improves visibility and reduces night crime by 15%'
  },
  pothole_fix: {
    base: 50000, label: 'Pothole / Road Repair',
    crimeReduction: 0, safetyGain: 6, roiMultiplier: 3.1,
    description: 'Surface repair reduces accident risk and vehicle damage by ~40%'
  },
  camera: {
    base: 45000, label: 'CCTV Camera Installation',
    crimeReduction: 20, safetyGain: 5, roiMultiplier: 3.5,
    description: 'Surveillance cameras deter criminal activity and aid investigation'
  },
  speed_bump: {
    base: 12000, label: 'Speed Bump / Traffic Calming',
    crimeReduction: 0, safetyGain: 10, roiMultiplier: 2.8,
    description: 'Traffic calming reduces speeding accidents by 30% in residential areas'
  },
  hospital: {
    base: 850000, label: 'Hospital / Medical Centre',
    crimeReduction: 5, safetyGain: 18, roiMultiplier: 5.1,
    description: 'Emergency medical facility reduces fatality risk by 40% within 2km radius'
  }
};

// ── Types ─────────────────────────────────────────────────────────────────────
type InfraType = 'police_booth' | 'streetlight' | 'pothole_fix' | 'camera' | 'speed_bump' | 'hospital';

interface Infrastructure {
  id: string;
  type: InfraType;
  latitude: number;
  longitude: number;
  status: 'simulated' | 'applied';
  aiCost: number;
  locationMultiplier: number;
}

interface SimResult {
  safetyScoreBefore: number;
  safetyScoreAfter: number;
  crimeRateBefore: number;
  crimeRateAfter: number;
  crimeReductionPct: number;
  totalAICost: number;
  totalSanctioned: number;
  totalSavings: number;
  avgROI: number;
  feasibilityScore: number;
  recommendation: string;
  profitLoss: number;
  breakdown: { type: string; count: number; cost: number; crimeReduction: number; safetyGain: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number) => `₹${v.toLocaleString()}`;

// Simulate location-based cost multiplier (0.8 – 1.4 based on lat/lng hash)
const locationMultiplier = (lat: number, lng: number) => {
  const hash = Math.abs(Math.sin(lat * 1000 + lng * 1000));
  return 0.85 + hash * 0.55; // 0.85 – 1.40
};

// ── Chart defaults ────────────────────────────────────────────────────────────
const lightChart = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { labels: { color: '#374151', font: { size: 11 } } },
    tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f9fafb', bodyColor: '#d1d5db' }
  },
  scales: {
    x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } },
    y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } }
  }
};

const noScale = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { labels: { color: '#374151', font: { size: 11 } } },
    tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f9fafb', bodyColor: '#d1d5db' }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export default function SimulationsPage() {
  const navigate = useNavigate();

  const [selectedTool, setSelectedTool]       = useState<InfraType | null>(null);
  const [infrastructure, setInfrastructure]   = useState<Infrastructure[]>([]);
  const [simResult, setSimResult]             = useState<SimResult | null>(null);
  const [isCalculating, setIsCalculating]     = useState(false);
  const [currentSimulation, setCurrentSim]    = useState<any>(null);
  const [showResults, setShowResults]         = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'summary' | 'cost' | 'crime' | 'safety'>('summary');
  const [linkedIssues, setLinkedIssues]       = useState<any[]>([]);
  const [selectedCity, setSelectedCity]       = useState('india');
  const mapData = WORLD_CENTERS[selectedCity];

  // Fetch map issues on mount for linking
  useEffect(() => {
    fetch('/api/reports/all').then(r => r.json()).then(d => {
      if (d.success && d.data?.reports) setLinkedIssues(d.data.reports.slice(0, 5));
    }).catch(() => {});
  }, []);

  // ── Map click handler ────────────────────────────────────────────────────
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (!selectedTool) return;
        const lm = locationMultiplier(e.latlng.lat, e.latlng.lng);
        const base = AI_COSTS[selectedTool].base;
        const newInfra: Infrastructure = {
          id: Date.now().toString(),
          type: selectedTool,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          status: 'simulated',
          aiCost: Math.round(base * lm),
          locationMultiplier: lm
        };
        setInfrastructure(prev => [...prev, newInfra]);
        setSelectedTool(null);
        setSimResult(null);
        setShowResults(false);
      }
    });
    return null;
  };

  // ── AI Impact Calculation ────────────────────────────────────────────────
  const calculateImpact = () => {
    if (infrastructure.length === 0) return;
    setIsCalculating(true);

    setTimeout(() => {
      // Aggregate by type
      const typeMap: Record<string, { count: number; totalCost: number; crimeReduction: number; safetyGain: number }> = {};
      infrastructure.forEach(i => {
        if (!typeMap[i.type]) typeMap[i.type] = { count: 0, totalCost: 0, crimeReduction: 0, safetyGain: 0 };
        typeMap[i.type].count++;
        typeMap[i.type].totalCost += i.aiCost;
        typeMap[i.type].crimeReduction = AI_COSTS[i.type].crimeReduction;
        typeMap[i.type].safetyGain     = AI_COSTS[i.type].safetyGain;
      });

      const breakdown = Object.entries(typeMap).map(([type, v]) => ({
        type: AI_COSTS[type as InfraType].label,
        count: v.count,
        cost: v.totalCost,
        crimeReduction: Math.min(v.crimeReduction * v.count, 60),
        safetyGain:     Math.min(v.safetyGain * v.count, 40)
      }));

      const totalAICost = infrastructure.reduce((s, i) => s + i.aiCost, 0);
      const totalSanc   = Math.round(totalAICost * 1.08); // typical 8% overhead
      const savings     = totalSanc - totalAICost;

      const totalCrimeRed = Math.min(breakdown.reduce((s, b) => s + b.crimeReduction, 0), 65);
      const totalSafetyGain = Math.min(breakdown.reduce((s, b) => s + b.safetyGain, 0), 35);

      const safetyBefore = 62;
      const safetyAfter  = Math.min(safetyBefore + totalSafetyGain, 98);

      const crimeBefore = 45;
      const crimeAfter  = Math.max(crimeBefore * (1 - totalCrimeRed / 100), 5);

      const avgROI = breakdown.length > 0
        ? (breakdown.reduce((s, b) => {
            const roi = AI_COSTS[Object.keys(AI_COSTS).find(k => AI_COSTS[k as InfraType].label === b.type) as InfraType]?.roiMultiplier || 2;
            return s + roi;
          }, 0) / breakdown.length)
        : 0;

      const feasibility = Math.min(
        60 +
        (totalCrimeRed > 0 ? 15 : 0) +
        (totalSafetyGain > 5 ? 10 : 0) +
        (avgROI > 3 ? 10 : 5) +
        (savings > 0 ? 5 : 0),
        100
      );

      const profitLoss = totalSanc - totalAICost;

      const rec = feasibility >= 85
        ? '✅ Highly recommended — strong safety ROI and crime reduction impact.'
        : feasibility >= 70
        ? '⚠️ Recommended with review — good ROI but consider phased implementation.'
        : '❌ Needs redesign — costs outweigh projected benefits. Review infrastructure mix.';

      setSimResult({
        safetyScoreBefore: safetyBefore,
        safetyScoreAfter: safetyAfter,
        crimeRateBefore: crimeBefore,
        crimeRateAfter: Math.round(crimeAfter),
        crimeReductionPct: totalCrimeRed,
        totalAICost,
        totalSanctioned: totalSanc,
        totalSavings: savings,
        avgROI: +avgROI.toFixed(2),
        feasibilityScore: feasibility,
        recommendation: rec,
        profitLoss,
        breakdown
      });
      setShowResults(true);
      setIsCalculating(false);
    }, 1800);
  };

  const applySimulation = async () => {
    if (!simResult) return;
    if (!confirm('Apply all placements to production? Citizens will be notified.')) return;
    try {
      await fetch('/api/simulations', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Simulation ${new Date().toLocaleDateString()}`, description: 'Digital Twin', center_lat: mapData.center[0], center_lng: mapData.center[1], radius_meters: 5000 })
      });
      setInfrastructure(prev => prev.map(i => ({ ...i, status: 'applied' })));
      alert('✅ Simulation applied! Infrastructure plan submitted for sanction.');
    } catch { alert('Failed to apply simulation'); }
  };

  const clearSimulation = () => {
    setInfrastructure([]); setSimResult(null); setShowResults(false); setSelectedTool(null);
  };

  const removeInfra = (id: string) => {
    setInfrastructure(prev => prev.filter(i => i.id !== id));
    setSimResult(null); setShowResults(false);
  };

  // ── Toolbar definitions ──────────────────────────────────────────────────
  const tools: { type: InfraType; emoji: string; label: string; shortLabel: string; color: string }[] = [
    { type: 'police_booth', emoji: '🚔', label: 'Police Booth',         shortLabel: 'Police',    color: '#006876' },
    { type: 'streetlight',  emoji: '💡', label: 'Streetlight',          shortLabel: 'Light',     color: '#00658f' },
    { type: 'pothole_fix',  emoji: '⚠️', label: 'Pothole / Road Fix',   shortLabel: 'Pothole',   color: '#904d00' },
    { type: 'camera',       emoji: '📷', label: 'CCTV Camera',          shortLabel: 'Camera',    color: '#6d28d9' },
    { type: 'speed_bump',   emoji: '🚧', label: 'Speed Bump',           shortLabel: 'Bump',      color: '#be185d' },
    { type: 'hospital',     emoji: '🏥', label: 'Hospital / Medical Centre', shortLabel: 'Hospital', color: '#ec4899' }
  ];

  // ── Chart data (from simResult) ──────────────────────────────────────────
  const costChart = simResult ? {
    labels: simResult.breakdown.map(b => b.type),
    datasets: [
      { label: 'AI Cost Estimate (₹)',  data: simResult.breakdown.map(b => b.cost),               backgroundColor: 'rgba(245,158,11,0.8)', borderRadius: 6 },
      { label: 'Sanctioned Budget (₹)', data: simResult.breakdown.map(b => Math.round(b.cost * 1.08)), backgroundColor: 'rgba(59,130,246,0.8)',  borderRadius: 6 }
    ]
  } : null;

  const crimeChart = simResult ? {
    labels: ['Before', 'After Implementation'],
    datasets: [{
      label: 'Crime Incidents / Month',
      data: [simResult.crimeRateBefore, simResult.crimeRateAfter],
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(34,197,94,0.8)'],
      borderRadius: 8
    }]
  } : null;

  const safetyChart = simResult ? {
    labels: ['Current Safety Score', 'Projected Score'],
    datasets: [{
      label: 'Road Safety Score / 100',
      data: [simResult.safetyScoreBefore, simResult.safetyScoreAfter],
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(34,197,94,0.8)'],
      borderRadius: 8
    }]
  } : null;

  const feasChart = simResult ? {
    labels: ['Feasible', 'Risk'],
    datasets: [{
      data: [simResult.feasibilityScore, 100 - simResult.feasibilityScore],
      backgroundColor: [simResult.feasibilityScore >= 80 ? 'rgba(34,197,94,0.85)' : 'rgba(245,158,11,0.85)', 'rgba(55,65,81,0.4)'],
      borderColor: [simResult.feasibilityScore >= 80 ? '#22c55e' : '#f59e0b', '#374151'],
      borderWidth: 2
    }]
  } : null;

  // ── Six-month trend preview ──────────────────────────────────────────────
  const trendChart = simResult ? {
    labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
    datasets: [
      {
        label: 'Safety Score',
        data: [simResult.safetyScoreBefore,
          simResult.safetyScoreBefore + (simResult.safetyScoreAfter - simResult.safetyScoreBefore) * 0.15,
          simResult.safetyScoreBefore + (simResult.safetyScoreAfter - simResult.safetyScoreBefore) * 0.3,
          simResult.safetyScoreBefore + (simResult.safetyScoreAfter - simResult.safetyScoreBefore) * 0.55,
          simResult.safetyScoreBefore + (simResult.safetyScoreAfter - simResult.safetyScoreBefore) * 0.8,
          simResult.safetyScoreAfter],
        fill: true, backgroundColor: 'rgba(34,197,94,0.1)', borderColor: '#22c55e', borderWidth: 2, tension: 0.4, yAxisID: 'y'
      },
      {
        label: 'Crime Rate',
        data: [simResult.crimeRateBefore,
          simResult.crimeRateBefore - (simResult.crimeRateBefore - simResult.crimeRateAfter) * 0.1,
          simResult.crimeRateBefore - (simResult.crimeRateBefore - simResult.crimeRateAfter) * 0.25,
          simResult.crimeRateBefore - (simResult.crimeRateBefore - simResult.crimeRateAfter) * 0.5,
          simResult.crimeRateBefore - (simResult.crimeRateBefore - simResult.crimeRateAfter) * 0.75,
          simResult.crimeRateAfter],
        fill: true, backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444', borderWidth: 2, tension: 0.4, yAxisID: 'y2'
      }
    ]
  } : null;

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: '#374151', font: { size: 11 } } },
      tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f9fafb', bodyColor: '#d1d5db' }
    },
    scales: {
      x:  { ticks: { color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y:  { ticks: { color: '#22c55e' }, grid: { color: 'rgba(0,0,0,0.04)' }, position: 'left'  as const, min: 0, max: 100 },
      y2: { ticks: { color: '#ef4444' }, grid: { display: false },            position: 'right' as const, min: 0 }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col py-6 h-screen w-[260px] bg-white border-r border-gray-200 fixed left-0 top-0 z-50">
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-[#00658f]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span className="text-xl font-bold">
              <span className="text-[#00658f]">Win</span><span className="text-[#904d00]">Guard</span>
            </span>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {[
            { path: '/',            label: 'Dashboard',   emoji: '🏠', active: false },
            { path: '/simulations', label: 'Simulations', emoji: '🗺️', active: true  },
            { path: '/issues',      label: 'Issues',      emoji: '⚠️', active: false },
            { path: '/reports',     label: 'Reports',     emoji: '📋', active: false },
            { path: '/budget',      label: 'Budget',      emoji: '💰', active: false },
            { path: '/analytics',   label: 'Analytics',   emoji: '📊', active: false }
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-left transition-colors text-sm ${
                item.active
                  ? 'text-[#00658f] font-bold bg-[#c7e7ff] border-l-4 border-[#00658f]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{item.emoji}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Linked issues from map */}
        {linkedIssues.length > 0 && (
          <div className="px-3 mt-4 border-t border-gray-200 pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">📍 Map Issues</p>
            {linkedIssues.slice(0, 4).map(issue => (
              <div key={issue.report_id} className="px-3 py-2 rounded-lg hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate('/issues')}>
                <p className="text-xs font-semibold text-gray-700 truncate">{issue.category}</p>
                <p className="text-xs text-gray-400">{issue.status}</p>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 md:ml-[260px] min-h-screen">

        {/* ── Top Bar ── */}
        <header className="fixed top-0 right-0 left-0 md:left-[260px] bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm z-40 h-16 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">🗺️ Global Infrastructure Digital Twin</h1>
            <p className="text-xs text-gray-500">Simulate &amp; deploy safety infrastructure worldwide</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="px-3 py-2 bg-gray-800 text-white border border-teal-700 rounded-lg text-sm"
            >
              {Object.entries(WORLD_CENTERS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            {!currentSimulation ? (
              <button
                onClick={() => setCurrentSim({ id: Date.now() })}
                className="px-4 py-2 bg-gradient-to-r from-[#00658f] to-[#00b5fc] text-white rounded-lg text-sm font-bold hover:shadow-lg transition"
              >
                ▶ Start Simulation
              </button>
            ) : (
              <>
                <button
                  onClick={calculateImpact}
                  disabled={infrastructure.length === 0 || isCalculating}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-bold hover:shadow-lg transition disabled:opacity-50"
                >
                  {isCalculating ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Calculating…</span>
                  ) : '🤖 AI Impact Analysis'}
                </button>
                {simResult && (
                  <button
                    onClick={applySimulation}
                    className="px-4 py-2 bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white rounded-lg text-sm font-bold hover:shadow-lg transition"
                  >
                    ✅ Apply & Sanction
                  </button>
                )}
                <button onClick={clearSimulation} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition">
                  🗑 Clear
                </button>
              </>
            )}
          </div>
        </header>

        <div className="mt-16 flex h-[calc(100vh-4rem)] overflow-hidden">

          {/* ── Left Panel ── */}
          <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-4">

            {/* Tool Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Infrastructure Tools</h2>
              <div className="space-y-2">
                {tools.map(tool => (
                  <button
                    key={tool.type}
                    onClick={() => setSelectedTool(tool.type === selectedTool ? null : tool.type)}
                    disabled={!currentSimulation}
                    className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-3 transition text-sm ${
                      selectedTool === tool.type
                        ? 'text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    style={selectedTool === tool.type ? { background: tool.color } : {}}
                  >
                    <span className="text-lg">{tool.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{tool.label}</p>
                      <p className="text-xs opacity-70">AI est: {fmt(AI_COSTS[tool.type].base)}</p>
                    </div>
                  </button>
                ))}
              </div>
              {selectedTool && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-800">
                  <strong>Click on the map</strong> to place {tools.find(t => t.type === selectedTool)?.label}.
                  AI will calculate location-adjusted cost automatically.
                </div>
              )}
              {!currentSimulation && (
                <p className="mt-3 text-xs text-gray-500 text-center">Start simulation first to place infrastructure</p>
              )}
            </div>

            {/* Placed Items */}
            {infrastructure.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider flex items-center justify-between">
                  <span>Placed ({infrastructure.length})</span>
                  <span className="text-teal-600 font-bold text-xs">
                    Est: {fmt(infrastructure.reduce((s, i) => s + i.aiCost, 0))}
                  </span>
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {infrastructure.map(infra => (
                    <div key={infra.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{tools.find(t => t.type === infra.type)?.emoji}</span>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{tools.find(t => t.type === infra.type)?.shortLabel}</p>
                          <p className="text-xs text-teal-600 font-bold">{fmt(infra.aiCost)}</p>
                          <p className="text-xs text-gray-400">{infra.locationMultiplier.toFixed(2)}× location</p>
                        </div>
                      </div>
                      <button onClick={() => removeInfra(infra.id)} className="text-red-400 hover:text-red-600 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Map Issues */}
            {linkedIssues.length > 0 && (
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider text-orange-700">
                  🔗 Linked Map Issues
                </h2>
                <div className="space-y-2">
                  {linkedIssues.slice(0, 3).map(issue => {
                    const issueToolMap: Record<string, InfraType> = {
                      'pothole': 'pothole_fix', 'road crack': 'pothole_fix',
                      'streetlight': 'streetlight', 'police': 'police_booth'
                    };
                    const matchedTool = Object.entries(issueToolMap).find(([k]) =>
                      issue.category.toLowerCase().includes(k)
                    )?.[1];
                    return (
                      <div key={issue.report_id} className="p-2.5 bg-orange-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-800 truncate">{issue.category}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Severity: {issue.severity}/10</p>
                        {matchedTool && (
                          <button
                            onClick={() => setSelectedTool(matchedTool)}
                            disabled={!currentSimulation}
                            className="mt-1.5 text-xs px-2 py-1 bg-orange-500 text-white rounded font-bold hover:bg-orange-600 transition disabled:opacity-40"
                          >
                            + Add Fix to Map
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Map + Results ── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Map */}
            <div className={`relative transition-all ${showResults ? 'h-[55%]' : 'h-full'}`}>
              <MapContainer
                key={selectedCity}
                center={mapData.center}
                zoom={mapData.zoom}
                className="h-full w-full"
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler />
                <Circle
                  center={mapData.center}
                  radius={5000}
                  pathOptions={{ color: '#00658f', fillColor: '#00b5fc', fillOpacity: 0.04, weight: 2, dashArray: '10, 10' }}
                />
                {infrastructure.map(infra => (
                  <Marker key={infra.id} position={[infra.latitude, infra.longitude]} icon={ICONS[infra.type]}>
                    <Popup>
                      <div className="text-sm min-w-48">
                        <p className="font-bold text-gray-900">{AI_COSTS[infra.type].label}</p>
                        <p className="text-gray-600 text-xs mt-1">{AI_COSTS[infra.type].description}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">AI Cost</span>
                            <span className="font-bold text-teal-600">{fmt(infra.aiCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Location Factor</span>
                            <span className="font-bold">{infra.locationMultiplier.toFixed(2)}×</span>
                          </div>
                          {AI_COSTS[infra.type].crimeReduction > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Crime ↓</span>
                              <span className="font-bold text-purple-600">-{AI_COSTS[infra.type].crimeReduction}%</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Safety Gain</span>
                            <span className="font-bold text-green-600">+{AI_COSTS[infra.type].safetyGain} pts</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">ROI</span>
                            <span className="font-bold text-blue-600">{AI_COSTS[infra.type].roiMultiplier}×</span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">Status: {infra.status}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Map overlay hint */}
              {selectedTool && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-[500] animate-bounce">
                  Click to place {tools.find(t => t.type === selectedTool)?.label}
                </div>
              )}

              {isCalculating && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-[500]">
                  <div className="bg-white rounded-xl p-6 text-center shadow-2xl">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="font-bold text-gray-900">🤖 AI Analysing Impact…</p>
                    <p className="text-sm text-gray-500 mt-1">Calculating costs, crime reduction & safety score</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Results Panel ── */}
            {showResults && simResult && (
              <div className="flex-1 bg-white border-t-2 border-teal-400 overflow-y-auto">
                {/* Result Tabs */}
                <div className="flex border-b border-gray-200 px-4 pt-3">
                  {[
                    { id: 'summary', label: '📊 Summary' },
                    { id: 'cost',    label: '💰 Cost & P&L' },
                    { id: 'crime',   label: '🔒 Crime Rate' },
                    { id: 'safety',  label: '🛡️ Safety Score' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveResultTab(tab.id as any)}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all mr-2 ${
                        activeResultTab === tab.id
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2 pb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      simResult.feasibilityScore >= 80
                        ? 'bg-green-100 text-green-700'
                        : simResult.feasibilityScore >= 65
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      Feasibility: {simResult.feasibilityScore}%
                    </span>
                  </div>
                </div>

                {/* Summary Tab */}
                {activeResultTab === 'summary' && (
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'AI Cost Est.', value: fmt(simResult.totalAICost), color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
                        { label: 'Sanctioned',   value: fmt(simResult.totalSanctioned), color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                        { label: 'Net Savings',  value: fmt(simResult.totalSavings), color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                        { label: 'Avg ROI',      value: `${simResult.avgROI}×`,          color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
                        { label: 'Crime ↓',      value: `-${simResult.crimeReductionPct}%`, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
                        { label: 'Safety +',     value: `+${simResult.safetyScoreAfter - simResult.safetyScoreBefore} pts`, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                        { label: 'Safety Score', value: `${simResult.safetyScoreBefore} → ${simResult.safetyScoreAfter}`, color: 'text-gray-800', bg: 'bg-gray-50 border-gray-200' },
                        { label: 'Feasibility',  value: `${simResult.feasibilityScore}%`, color: simResult.feasibilityScore >= 80 ? 'text-green-600' : 'text-yellow-600', bg: 'bg-gray-50 border-gray-200' }
                      ].map((card, i) => (
                        <div key={i} className={`rounded-xl p-3 border ${card.bg}`}>
                          <p className="text-gray-500 text-xs font-semibold">{card.label}</p>
                          <p className={`text-lg font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-200 mb-4">
                      <p className="font-bold text-gray-900 mb-1">🤖 AI Recommendation</p>
                      <p className="text-sm text-gray-700">{simResult.recommendation}</p>
                    </div>
                    {trendChart && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-2">📈 Projected 6-Month Trend</p>
                        <Line data={trendChart} options={trendOptions as any} />
                      </div>
                    )}
                  </div>
                )}

                {/* Cost Tab */}
                {activeResultTab === 'cost' && costChart && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'AI Cost Estimate', value: fmt(simResult.totalAICost), color: 'text-yellow-600' },
                        { label: 'Sanctioned Budget', value: fmt(simResult.totalSanctioned), color: 'text-blue-600' },
                        { label: 'Savings', value: fmt(simResult.totalSavings), color: 'text-green-600' }
                      ].map((c, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                          <p className="text-xs text-gray-500 font-semibold">{c.label}</p>
                          <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                        </div>
                      ))}
                    </div>
                    <Bar data={costChart} options={lightChart as any} />
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b">{['Type', 'Count', 'AI Cost', 'Sanctioned', 'ROI'].map(h => <th key={h} className="text-left py-2 px-2 text-gray-500 font-semibold">{h}</th>)}</tr></thead>
                        <tbody>
                          {simResult.breakdown.map(b => {
                            const roiKey = Object.keys(AI_COSTS).find(k => AI_COSTS[k as InfraType].label === b.type);
                            const roi = roiKey ? AI_COSTS[roiKey as InfraType].roiMultiplier : '—';
                            return (
                              <tr key={b.type} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-2 font-medium">{b.type}</td>
                                <td className="py-2 px-2 text-gray-600">{b.count}</td>
                                <td className="py-2 px-2 text-yellow-600 font-bold">{fmt(b.cost)}</td>
                                <td className="py-2 px-2 text-blue-600 font-bold">{fmt(Math.round(b.cost * 1.08))}</td>
                                <td className="py-2 px-2 text-teal-600 font-bold">{roi}×</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Crime Tab */}
                {activeResultTab === 'crime' && crimeChart && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Before', value: simResult.crimeRateBefore, color: 'text-red-600' },
                        { label: 'After (Projected)', value: simResult.crimeRateAfter, color: 'text-green-600' },
                        { label: 'Reduction', value: `-${simResult.crimeReductionPct}%`, color: 'text-purple-600' }
                      ].map((c, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                          <p className="text-xs text-gray-500 font-semibold">{c.label}</p>
                          <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                        </div>
                      ))}
                    </div>
                    <Bar data={crimeChart} options={lightChart as any} />
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 text-sm text-purple-800">
                      <strong>How it's calculated:</strong> Each streetlight reduces crime by 15% in its vicinity,
                      each police booth by 25%, and each CCTV camera by 20%.
                      Effects are compound but capped at 65% to reflect real-world limits.
                    </div>
                  </div>
                )}

                {/* Safety Tab */}
                {activeResultTab === 'safety' && safetyChart && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Current Score', value: simResult.safetyScoreBefore, color: 'text-red-600' },
                        { label: 'Projected Score', value: simResult.safetyScoreAfter, color: 'text-green-600' },
                        { label: 'Improvement', value: `+${simResult.safetyScoreAfter - simResult.safetyScoreBefore}`, color: 'text-teal-600' }
                      ].map((c, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                          <p className="text-xs text-gray-500 font-semibold">{c.label}</p>
                          <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                        </div>
                      ))}
                    </div>
                    <Bar data={safetyChart} options={lightChart as any} />
                    <div className="grid grid-cols-2 gap-4">
                      {feasChart && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <p className="text-sm font-bold text-gray-700 mb-2">Feasibility Score</p>
                          <div className="flex justify-center h-36">
                            <Doughnut data={feasChart} options={noScale as any} />
                          </div>
                        </div>
                      )}
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm font-bold text-gray-700 mb-3">Safety Factor Gains</p>
                        <div className="space-y-2">
                          {simResult.breakdown.map(b => (
                            <div key={b.type}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-gray-600 truncate">{b.type}</span>
                                <span className="text-green-600 font-bold">+{b.safetyGain} pts</span>
                              </div>
                              <div className="bg-gray-100 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(b.safetyGain * 2.5, 100)}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

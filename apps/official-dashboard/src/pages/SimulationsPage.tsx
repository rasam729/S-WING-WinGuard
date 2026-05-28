import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulationStore } from '../store/simulationStore';

// Bengaluru coordinates
const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 13;

// Custom marker icons
const policeIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: #006876; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-center; color: white; font-size: 18px;">🚔</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const streetlightIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: #00658f; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-center; color: white; font-size: 16px;">💡</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const potholeIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: #904d00; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-center; color: white; font-size: 14px;">⚠️</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface Infrastructure {
  id: string;
  type: 'police_booth' | 'streetlight' | 'pothole_fix';
  latitude: number;
  longitude: number;
  status: 'simulated' | 'applied';
}

interface SimulationStats {
  safetyScoreBefore: number;
  safetyScoreAfter: number;
  crimeRateChange: number;
  recommendation: string;
}

interface BudgetData {
  issue_type: string;
  estimated_cost: number;
  ai_predicted_cost: number;
  confidence_score: number;
  savings: number;
  recommendation: string;
  cost_factors: any;
}

interface CrimeData {
  crime_incidents_before: number;
  crime_incidents_after: number;
  predicted_reduction_percentage: number;
  incidents_prevented: number;
  recommendation: string;
}

export default function SimulationsPage() {
  const navigate = useNavigate();
  const { } = useSimulationStore();
  
  const [selectedTool, setSelectedTool] = useState<'police_booth' | 'streetlight' | 'pothole_fix' | null>(null);
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([]);
  const [simulationStats, setSimulationStats] = useState<SimulationStats | null>(null);
  const [currentSimulation, setCurrentSimulation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [crimeData, setCrimeData] = useState<CrimeData | null>(null);
  const [showBudgetCalc, setShowBudgetCalc] = useState(false);
  const [showCrimeCalc, setShowCrimeCalc] = useState(false);

  // Map click handler
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (selectedTool) {
          const newInfra: Infrastructure = {
            id: Date.now().toString(),
            type: selectedTool,
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            status: 'simulated'
          };
          setInfrastructure([...infrastructure, newInfra]);
          setSelectedTool(null);
        }
      },
    });
    return null;
  };

  const createSimulation = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Bengaluru Safety Simulation ${new Date().toLocaleDateString()}`,
          description: 'Digital Twin simulation for infrastructure improvements',
          center_lat: BENGALURU_CENTER[0],
          center_lng: BENGALURU_CENTER[1],
          radius_meters: 5000
        })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentSimulation(data.data);
        alert('Simulation created successfully!');
      }
    } catch (error) {
      console.error('Error creating simulation:', error);
      alert('Failed to create simulation');
    }
  };

  const calculateImpact = async () => {
    if (!currentSimulation) {
      alert('Please create a simulation first');
      return;
    }

    setIsCalculating(true);
    try {
      // Add all infrastructure to simulation
      for (const infra of infrastructure) {
        await fetch(`http://localhost:3000/api/simulations/${currentSimulation.simulation_id}/add-infrastructure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: infra.type,
            latitude: infra.latitude,
            longitude: infra.longitude,
            status: 'functional'
          })
        });
      }

      // Calculate impact
      const response = await fetch(`http://localhost:3000/api/simulations/${currentSimulation.simulation_id}/calculate-impact`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setSimulationStats(data.data);
      }

      // Calculate crime impact
      const streetlights = infrastructure.filter(i => i.type === 'streetlight').length;
      const policeBooths = infrastructure.filter(i => i.type === 'police_booth').length;
      
      if (streetlights > 0 || policeBooths > 0) {
        const crimeResponse = await fetch(`http://localhost:3000/api/simulations/${currentSimulation.simulation_id}/calculate-crime-impact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: BENGALURU_CENTER[0],
            longitude: BENGALURU_CENTER[1],
            radius_meters: 5000,
            new_streetlights: streetlights,
            new_police_booths: policeBooths
          })
        });
        const crimeResult = await crimeResponse.json();
        if (crimeResult.success) {
          setCrimeData(crimeResult.data);
        }
      }

      // Calculate budget for pothole fixes
      const potholes = infrastructure.filter(i => i.type === 'pothole_fix');
      if (potholes.length > 0) {
        const budgetResponse = await fetch(`http://localhost:3000/api/simulations/${currentSimulation.simulation_id}/calculate-budget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issue_type: 'Pothole',
            base_cost: 50000 * potholes.length,
            latitude: BENGALURU_CENTER[0],
            longitude: BENGALURU_CENTER[1],
            road_type: 'MDR'
          })
        });
        const budgetResult = await budgetResponse.json();
        if (budgetResult.success) {
          setBudgetData(budgetResult.data);
        }
      }
    } catch (error) {
      console.error('Error calculating impact:', error);
      alert('Failed to calculate impact');
    } finally {
      setIsCalculating(false);
    }
  };

  const applySimulation = async () => {
    if (!currentSimulation) return;

    if (!confirm('This will apply all changes to production. Citizens will be notified. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/simulations/${currentSimulation.simulation_id}/apply`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Simulation applied! ${data.data.notifications_sent} citizens notified.`);
        // Mark all as applied
        setInfrastructure(infrastructure.map(i => ({ ...i, status: 'applied' })));
      }
    } catch (error) {
      console.error('Error applying simulation:', error);
      alert('Failed to apply simulation');
    }
  };

  const clearSimulation = () => {
    setInfrastructure([]);
    setSimulationStats(null);
    setCurrentSimulation(null);
    setSelectedTool(null);
    setBudgetData(null);
    setCrimeData(null);
  };

  const removeInfrastructure = (id: string) => {
    setInfrastructure(infrastructure.filter(i => i.id !== id));
  };

  const getInfraIcon = (type: string) => {
    switch (type) {
      case 'police_booth': return policeIcon;
      case 'streetlight': return streetlightIcon;
      case 'pothole_fix': return potholeIcon;
      default: return policeIcon;
    }
  };

  const getInfraLabel = (type: string) => {
    switch (type) {
      case 'police_booth': return 'Police Booth';
      case 'streetlight': return 'Streetlight';
      case 'pothole_fix': return 'Pothole Fix';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col py-6 h-screen w-[280px] bg-[#edeeef] border-r border-gray-200 fixed left-0 top-0 z-50">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-[#00658f]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-[#00658f]">Win</span>
              <span className="text-[#904d00]">Guard</span>
            </span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-white w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span>Dashboard</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#00658f] font-bold bg-[#c7e7ff] border-l-4 border-[#00658f] w-full text-left">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
            <span>Simulations</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] min-h-screen pb-8">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 md:left-[280px] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm z-40 h-16 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Digital Twin Simulation</h1>
            <p className="text-xs text-gray-600">Bengaluru Infrastructure Planning</p>
          </div>
          <div className="flex gap-2">
            {!currentSimulation ? (
              <button
                onClick={createSimulation}
                className="bg-gradient-to-r from-[#00658f] to-[#00b5fc] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
              >
                Create Simulation
              </button>
            ) : (
              <>
                <button
                  onClick={calculateImpact}
                  disabled={infrastructure.length === 0 || isCalculating}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCalculating ? 'Calculating...' : 'Calculate Impact'}
                </button>
                <button
                  onClick={applySimulation}
                  disabled={!simulationStats}
                  className="bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply to Production
                </button>
                <button
                  onClick={clearSimulation}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </header>

        <div className="mt-20 px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tools Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Infrastructure Tools</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedTool('police_booth')}
                    className={`w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-all ${
                      selectedTool === 'police_booth'
                        ? 'bg-gradient-to-r from-[#006876] to-[#58e6ff] text-white shadow-md'
                        : 'bg-[#edeeef] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-xl">🚔</span>
                    <span className="font-semibold">Add Police Booth</span>
                  </button>
                  <button
                    onClick={() => setSelectedTool('streetlight')}
                    className={`w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-all ${
                      selectedTool === 'streetlight'
                        ? 'bg-gradient-to-r from-[#00658f] to-[#00b5fc] text-white shadow-md'
                        : 'bg-[#edeeef] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-xl">💡</span>
                    <span className="font-semibold">Add Streetlight</span>
                  </button>
                  <button
                    onClick={() => setSelectedTool('pothole_fix')}
                    className={`w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-all ${
                      selectedTool === 'pothole_fix'
                        ? 'bg-gradient-to-r from-[#904d00] to-[#ff8c00] text-white shadow-md'
                        : 'bg-[#edeeef] text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-xl">⚠️</span>
                    <span className="font-semibold">Fix Pothole</span>
                  </button>
                </div>
                {selectedTool && (
                  <p className="mt-4 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    Click on the map to place {getInfraLabel(selectedTool)}
                  </p>
                )}
              </div>

              {/* Pending Changes */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Changes ({infrastructure.length})
                </h2>
                {infrastructure.length === 0 ? (
                  <p className="text-sm text-gray-600">No changes yet. Select a tool and click on the map.</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {infrastructure.map((infra) => (
                      <div
                        key={infra.id}
                        className="flex items-center justify-between p-3 bg-[#edeeef] rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {infra.type === 'police_booth' ? '🚔' : infra.type === 'streetlight' ? '💡' : '⚠️'}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">{getInfraLabel(infra.type)}</p>
                            <p className="text-xs text-gray-600">
                              {infra.latitude.toFixed(4)}, {infra.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeInfrastructure(infra.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Impact Stats */}
              {simulationStats && (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 shadow-sm border border-green-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Impact Analysis</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Safety Score</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-red-600">{simulationStats.safetyScoreBefore}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-2xl font-bold text-green-600">{simulationStats.safetyScoreAfter}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Crime Rate Change</p>
                      <p className={`text-2xl font-bold ${simulationStats.crimeRateChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {simulationStats.crimeRateChange > 0 ? '+' : ''}{simulationStats.crimeRateChange}%
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-300">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Recommendation</p>
                      <p className="text-sm text-gray-800">{simulationStats.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Analysis */}
              {budgetData && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 shadow-sm border border-yellow-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">AI Budget Analysis</h2>
                    <button
                      onClick={() => setShowBudgetCalc(!showBudgetCalc)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      {showBudgetCalc ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Estimated Cost</p>
                      <p className="text-2xl font-bold text-gray-900">₹{budgetData.estimated_cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">AI Predicted Cost</p>
                      <p className="text-2xl font-bold text-blue-600">₹{budgetData.ai_predicted_cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Potential Savings</p>
                      <p className="text-2xl font-bold text-green-600">₹{budgetData.savings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Confidence Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${budgetData.confidence_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{budgetData.confidence_score.toFixed(0)}%</span>
                      </div>
                    </div>
                    {showBudgetCalc && budgetData.cost_factors && (
                      <div className="pt-3 border-t border-gray-300">
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Cost Factors</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Base Cost:</span>
                            <span className="font-semibold">₹{budgetData.cost_factors.base_cost?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Location Multiplier:</span>
                            <span className="font-semibold">{budgetData.cost_factors.location_multiplier?.toFixed(2)}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Road Type Multiplier:</span>
                            <span className="font-semibold">{budgetData.cost_factors.road_type_multiplier?.toFixed(2)}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bulk Discount:</span>
                            <span className="font-semibold">{budgetData.cost_factors.bulk_discount?.toFixed(2)}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nearby Issues:</span>
                            <span className="font-semibold">{budgetData.cost_factors.nearby_issues}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-300">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Recommendation</p>
                      <p className="text-sm text-gray-800">{budgetData.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Crime Analytics */}
              {crimeData && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 shadow-sm border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Crime Analytics</h2>
                    <button
                      onClick={() => setShowCrimeCalc(!showCrimeCalc)}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      {showCrimeCalc ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Crime Incidents</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-red-600">{crimeData.crime_incidents_before}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-2xl font-bold text-green-600">{crimeData.crime_incidents_after}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Predicted Reduction</p>
                      <p className="text-2xl font-bold text-green-600">
                        {crimeData.predicted_reduction_percentage.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Incidents Prevented</p>
                      <p className="text-2xl font-bold text-purple-600">{crimeData.incidents_prevented}</p>
                    </div>
                    {showCrimeCalc && (
                      <div className="pt-3 border-t border-gray-300">
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Infrastructure Added</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Streetlights:</span>
                            <span className="font-semibold">{crimeData.new_streetlights || 0} (15% reduction each)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Police Booths:</span>
                            <span className="font-semibold">{crimeData.new_police_booths || 0} (25% reduction each)</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-300">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Impact Rating</p>
                      <p className="text-sm text-gray-800">{crimeData.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Simulation Map - Bengaluru</h3>
                  <p className="text-xs text-gray-600 mt-1">Click on the map to place infrastructure</p>
                </div>
                <div className="h-[700px] relative">
                  <MapContainer
                    center={BENGALURU_CENTER}
                    zoom={DEFAULT_ZOOM}
                    className="h-full w-full"
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <MapClickHandler />
                    
                    {/* Simulation radius */}
                    <Circle
                      center={BENGALURU_CENTER}
                      radius={5000}
                      pathOptions={{ color: '#00658f', fillColor: '#00b5fc', fillOpacity: 0.05, weight: 2, dashArray: '10, 10' }}
                    />
                    
                    {/* Placed infrastructure */}
                    {infrastructure.map((infra) => (
                      <Marker
                        key={infra.id}
                        position={[infra.latitude, infra.longitude]}
                        icon={getInfraIcon(infra.type)}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-bold">{getInfraLabel(infra.type)}</p>
                            <p className="text-xs text-gray-600">
                              Status: {infra.status === 'simulated' ? 'Simulated' : 'Applied'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {infra.latitude.toFixed(4)}, {infra.longitude.toFixed(4)}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

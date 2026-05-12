import React, { useState } from 'react';

interface RouteOption {
  routeType: string;
  name: string;
  description: string;
  distance: string;
  estimatedTime: number;
  safetyScore: number;
  waypoints: Array<{ lat: number; lng: number }>;
  color: string;
  issues: any[];
  recommendation: string;
}

interface RouteSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteSelect: (route: RouteOption) => void;
  userLocation: [number, number] | null;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({
  isOpen,
  onClose,
  onRouteSelect,
  userLocation
}) => {
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [startLat, setStartLat] = useState(userLocation?.[0] || 12.9716);
  const [startLng, setStartLng] = useState(userLocation?.[1] || 77.5946);
  const [endLat, setEndLat] = useState(12.9350);
  const [endLng, setEndLng] = useState(77.6200);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);

  const handleCalculateRoutes = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('http://localhost:3000/api/routes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLat,
          startLng,
          endLat,
          endLng,
          startAddress,
          endAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        setRoutes(data.data.routes);
      }
    } catch (error) {
      console.error('Error calculating routes:', error);
      alert('Failed to calculate routes');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSelectRoute = (route: RouteOption) => {
    setSelectedRoute(route);
    onRouteSelect(route);
  };

  const useCurrentLocation = () => {
    if (userLocation) {
      setStartLat(userLocation[0]);
      setStartLng(userLocation[1]);
      setStartAddress('Current Location');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1002] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-3xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Route Planner</h2>
              <p className="text-sm opacity-90 mt-1">Find the best route for your journey</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Location Inputs */}
          <div className="space-y-4">
            {/* Start Location */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Starting Point
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-green-600">
                    location_on
                  </span>
                  <input
                    type="text"
                    value={startAddress}
                    onChange={(e) => setStartAddress(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter starting address..."
                  />
                </div>
                <button
                  onClick={useCurrentLocation}
                  className="px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                  title="Use current location"
                >
                  <span className="material-symbols-outlined text-green-600">my_location</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="number"
                  step="0.000001"
                  value={startLat}
                  onChange={(e) => setStartLat(parseFloat(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={startLng}
                  onChange={(e) => setStartLng(parseFloat(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Longitude"
                />
              </div>
            </div>

            {/* End Location */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Destination
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-red-600">
                  flag
                </span>
                <input
                  type="text"
                  value={endAddress}
                  onChange={(e) => setEndAddress(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter destination address..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="number"
                  step="0.000001"
                  value={endLat}
                  onChange={(e) => setEndLat(parseFloat(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={endLng}
                  onChange={(e) => setEndLng(parseFloat(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Longitude"
                />
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculateRoutes}
              disabled={isCalculating}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Calculating Routes...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">route</span>
                  <span>Calculate Routes</span>
                </>
              )}
            </button>
          </div>

          {/* Route Options */}
          {routes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                Available Routes ({routes.length})
              </h3>

              {routes.map((route, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-2xl p-5 transition-all cursor-pointer ${
                    selectedRoute?.routeType === route.routeType
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectRoute(route)}
                  style={{ borderLeftWidth: '6px', borderLeftColor: route.color }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${route.color}20` }}
                      >
                        <span
                          className="material-symbols-outlined text-2xl"
                          style={{ color: route.color, fontVariationSettings: "'FILL' 1" }}
                        >
                          {route.routeType === 'safest' ? 'verified_user' :
                           route.routeType === 'balanced' ? 'balance' : 'speed'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{route.name}</h4>
                        <p className="text-sm text-gray-600">{route.description}</p>
                      </div>
                    </div>
                    {selectedRoute?.routeType === route.routeType && (
                      <span className="material-symbols-outlined text-blue-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Distance</p>
                      <p className="text-lg font-bold text-gray-900">{route.distance} km</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Time</p>
                      <p className="text-lg font-bold text-gray-900">{route.estimatedTime} min</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Safety</p>
                      <p
                        className="text-lg font-bold"
                        style={{
                          color: route.safetyScore >= 80 ? '#10b981' :
                                 route.safetyScore >= 60 ? '#f59e0b' : '#ef4444'
                        }}
                      >
                        {route.safetyScore}/100
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600 text-sm">warning</span>
                      <span className="text-sm text-gray-600">
                        {route.issues.length} issue{route.issues.length !== 1 ? 's' : ''} along route
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                      {route.recommendation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {selectedRoute && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onRouteSelect(selectedRoute);
                  onClose();
                }}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">navigation</span>
                <span>Start Navigation</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteSelector;

import React, { useState, useEffect, useRef } from 'react';
import { mockIssues } from '../store/issuesStore';
import {
  calculateGuardianPathWithRoads,
  calculateRouteStats,
} from '../../../../shared/routingUtils';

interface NavigationEngineProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number] | null;
  onRouteConfirm: (route: any) => void;
}

interface RouteOption {
  id: string;
  name: string;
  path: any[];
  stats: any;
  directions: any[];
  color: string;
}

const NavigationEngine: React.FC<NavigationEngineProps> = ({
  isOpen,
  onClose,
  userLocation,
  onRouteConfirm,
}) => {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startSearch, setStartSearch] = useState('');
  const [endSearch, setEndSearch] = useState('');
  const [startResults, setStartResults] = useState<any[]>([]);
  const [endResults, setEndResults] = useState<any[]>([]);
  const [showStartResults, setShowStartResults] = useState(false);
  const [showEndResults, setShowEndResults] = useState(false);
  const [useCoordinates, setUseCoordinates] = useState(false);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userLocation) {
      setStartLocation(`${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`);
      setStartSearch('Current Location');
    }
  }, [userLocation]);

  // Location search with debounce
  const searchLocation = async (query: string, isStart: boolean) => {
    if (query.length < 3) {
      if (isStart) setStartResults([]);
      else setEndResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      if (isStart) {
        setStartResults(data);
        setShowStartResults(true);
      } else {
        setEndResults(data);
        setShowEndResults(true);
      }
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  const handleSearchInput = (value: string, isStart: boolean) => {
    if (isStart) {
      setStartSearch(value);
    } else {
      setEndSearch(value);
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value, isStart);
    }, 500);
  };

  const selectLocation = (result: any, isStart: boolean) => {
    const coords = `${parseFloat(result.lat).toFixed(4)}, ${parseFloat(result.lon).toFixed(4)}`;
    
    if (isStart) {
      setStartLocation(coords);
      setStartSearch(result.display_name.split(',')[0]);
      setShowStartResults(false);
    } else {
      setEndLocation(coords);
      setEndSearch(result.display_name.split(',')[0]);
      setShowEndResults(false);
    }
  };

  // Text-to-Speech setup with female voice
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = new SpeechSynthesisUtterance();
      speechSynthRef.current.rate = 0.9;
      speechSynthRef.current.pitch = 1.1; // Slightly higher pitch for female voice
      speechSynthRef.current.volume = 1;
      
      // Wait for voices to load and select a female voice
      const setFemaleVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Try to find a female voice (prefer Google UK English Female, Microsoft Zira, or similar)
        const femaleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('victoria') ||
          voice.name.toLowerCase().includes('google uk english female') ||
          (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('female'))
        );
        
        if (femaleVoice) {
          speechSynthRef.current!.voice = femaleVoice;
          console.log('Selected female voice:', femaleVoice.name);
        } else {
          // Fallback: use any voice with higher pitch
          console.log('No specific female voice found, using default with adjusted pitch');
        }
      };
      
      // Voices might not be loaded immediately
      if (window.speechSynthesis.getVoices().length > 0) {
        setFemaleVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = setFemaleVoice;
      }
    }
  }, []);

  const parseCoordinates = (input: string): [number, number] | null => {
    const coords = input.split(',').map(s => parseFloat(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      return [coords[0], coords[1]];
    }
    return null;
  };

  const speakInstruction = (text: string) => {
    if ('speechSynthesis' in window && speechSynthRef.current) {
      window.speechSynthesis.cancel();
      speechSynthRef.current.text = text;
      window.speechSynthesis.speak(speechSynthRef.current);
      setIsSpeaking(true);
      
      speechSynthRef.current.onend = () => {
        setIsSpeaking(false);
      };
    }
  };

  const calculateRoutes = async () => {
    const start = parseCoordinates(startLocation);
    const end = parseCoordinates(endLocation);

    if (!start || !end) {
      alert('Please enter valid coordinates (e.g., 12.9716, 77.5946)');
      return;
    }

    setIsCalculating(true);

    try {
      // Prepare hazards and safe havens
      const hazards = mockIssues.filter(i => i.status !== 'resolved');
      const safeHavens = mockIssues.filter(i => i.type === 'police_booth' || i.type === 'hospital');

      // Calculate Guardian Path (Safe Route) with road following
      const guardianResult = await calculateGuardianPathWithRoads(
        { lat: start[0], lng: start[1] },
        { lat: end[0], lng: end[1] },
        hazards,
        safeHavens
      );

      const guardianStats = calculateRouteStats(guardianResult.path, mockIssues);
      const guardianDirections = guardianResult.steps || [];

      // Calculate Alternative Route (more direct)
      const altResult = await calculateGuardianPathWithRoads(
        { lat: start[0], lng: start[1] },
        { lat: end[0], lng: end[1] },
        [], // No hazard avoidance for alternative
        safeHavens
      );

      const altStats = calculateRouteStats(altResult.path, mockIssues);
      const altDirections = altResult.steps || [];

      const calculatedRoutes: RouteOption[] = [
        {
          id: 'guardian',
          name: 'Guardian Path',
          path: guardianResult.path,
          stats: {
            ...guardianStats,
            totalDistance: guardianResult.distance,
            estimatedMinutes: Math.round(guardianResult.duration),
          },
          directions: guardianDirections.map((step: any) => ({
            instruction: step.instruction,
            distance: guardianStats.totalDistance,
            distanceFromPrev: step.distance / 1000,
            bearing: 0,
            direction: '',
            location: step.location,
            type: step.type,
            safetyScore: guardianStats.avgSafetyScore,
          })),
          color: '#10b981',
        },
        {
          id: 'alternative',
          name: 'Alternative Route',
          path: altResult.path,
          stats: {
            ...altStats,
            totalDistance: altResult.distance,
            estimatedMinutes: Math.round(altResult.duration),
          },
          directions: altDirections.map((step: any) => ({
            instruction: step.instruction,
            distance: altStats.totalDistance,
            distanceFromPrev: step.distance / 1000,
            bearing: 0,
            direction: '',
            location: step.location,
            type: step.type,
            safetyScore: altStats.avgSafetyScore,
          })),
          color: '#3b82f6',
        },
      ];

      setRoutes(calculatedRoutes);
      setIsCalculating(false);
    } catch (error) {
      console.error('Route calculation error:', error);
      alert('Failed to calculate routes. Please try again.');
      setIsCalculating(false);
    }
  };

  const handleRouteSelect = (route: RouteOption) => {
    setSelectedRoute(route);
  };

  const handleConfirmRoute = () => {
    if (!selectedRoute) return;

    onRouteConfirm({
      path: selectedRoute.path,
      stats: selectedRoute.stats,
      directions: selectedRoute.directions,
      color: selectedRoute.color,
      name: selectedRoute.name,
    });

    setIsNavigating(true);
    setCurrentStepIndex(0);

    // Speak first instruction
    if (selectedRoute.directions.length > 0) {
      speakInstruction(selectedRoute.directions[0].instruction);
    }
  };

  const handleNextStep = () => {
    if (!selectedRoute || currentStepIndex >= selectedRoute.directions.length - 1) return;

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    speakInstruction(selectedRoute.directions[nextIndex].instruction);
  };

  const handlePrevStep = () => {
    if (currentStepIndex <= 0 || !selectedRoute) return;

    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    speakInstruction(selectedRoute.directions[prevIndex].instruction);
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const useCurrentLocation = () => {
    if (userLocation) {
      setStartLocation(`${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`);
      setStartSearch('Current Location');
    } else {
      alert('Please enable location services first!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-green-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Guardian Path Navigator</h2>
                <p className="text-sm opacity-90">Safe-First Routing Engine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!isNavigating ? (
            <>
              {/* Input Section */}
              <div className="space-y-4 mb-6">
                {/* Toggle between Search and Coordinates */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-bold text-gray-700">Input Mode:</span>
                  <button
                    onClick={() => setUseCoordinates(!useCoordinates)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-cyan-500 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {useCoordinates ? 'pin_drop' : 'search'}
                    </span>
                    <span className="text-sm font-bold">
                      {useCoordinates ? 'Coordinates' : 'Search'}
                    </span>
                  </button>
                </div>

                {/* Starting Location */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">my_location</span>
                    Starting Location
                  </label>
                  <div className="flex gap-2">
                    {useCoordinates ? (
                      <input
                        type="text"
                        value={startLocation}
                        onChange={(e) => setStartLocation(e.target.value)}
                        placeholder="12.9716, 77.5946"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none font-semibold text-sm"
                      />
                    ) : (
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={startSearch}
                          onChange={(e) => handleSearchInput(e.target.value, true)}
                          onFocus={() => startResults.length > 0 && setShowStartResults(true)}
                          placeholder="Search for a location..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none font-semibold text-sm"
                        />
                        {showStartResults && startResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                            {startResults.map((result, idx) => (
                              <button
                                key={idx}
                                onClick={() => selectLocation(result, true)}
                                className="w-full text-left px-4 py-3 hover:bg-cyan-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="material-symbols-outlined text-cyan-600 text-lg mt-0.5">location_on</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">
                                      {result.display_name.split(',')[0]}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {result.display_name}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={useCurrentLocation}
                      className="px-4 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">gps_fixed</span>
                      <span className="hidden sm:inline">Current</span>
                    </button>
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600">location_on</span>
                    Destination
                  </label>
                  {useCoordinates ? (
                    <input
                      type="text"
                      value={endLocation}
                      onChange={(e) => setEndLocation(e.target.value)}
                      placeholder="12.9350, 77.6200"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none font-semibold text-sm"
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={endSearch}
                        onChange={(e) => handleSearchInput(e.target.value, false)}
                        onFocus={() => endResults.length > 0 && setShowEndResults(true)}
                        placeholder="Search for destination..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none font-semibold text-sm"
                      />
                      {showEndResults && endResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                          {endResults.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectLocation(result, false)}
                              className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-600 text-lg mt-0.5">location_on</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900 text-sm truncate">
                                    {result.display_name.split(',')[0]}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {result.display_name}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={calculateRoutes}
                  disabled={isCalculating || !startLocation || !endLocation}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-green-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCalculating ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Calculating Guardian Path...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">explore</span>
                      <span>Find Safe Routes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Route Options */}
              {routes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-600">alt_route</span>
                    Available Routes
                  </h3>

                  {routes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => handleRouteSelect(route)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                        selectedRoute?.id === route.id
                          ? 'border-cyan-500 bg-cyan-50 shadow-lg scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: route.color }}
                          ></div>
                          <span className="font-bold text-xl text-gray-900">{route.name}</span>
                        </div>
                        {selectedRoute?.id === route.id && (
                          <span className="material-symbols-outlined text-cyan-600 text-3xl">
                            check_circle
                          </span>
                        )}
                      </div>

                      {/* Prominent Time and Distance Display */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-blue-600 text-sm">schedule</span>
                            <p className="text-xs text-blue-600 font-bold uppercase">Time</p>
                          </div>
                          <p className="font-bold text-3xl text-blue-900">{route.stats.estimatedMinutes}</p>
                          <p className="text-xs text-blue-600 font-medium">minutes</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-purple-600 text-sm">straighten</span>
                            <p className="text-xs text-purple-600 font-bold uppercase">Distance</p>
                          </div>
                          <p className="font-bold text-3xl text-purple-900">{route.stats.totalDistance}</p>
                          <p className="text-xs text-purple-600 font-medium">kilometers</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Safety Score</p>
                          <p
                            className="font-bold text-lg"
                            style={{
                              color:
                                route.stats.avgSafetyScore >= 80
                                  ? '#10b981'
                                  : route.stats.avgSafetyScore >= 60
                                  ? '#f59e0b'
                                  : '#ef4444',
                            }}
                          >
                            {route.stats.avgSafetyScore}/100
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Hazards</p>
                          <p className="font-bold text-lg text-gray-900">{route.stats.hazardsNearRoute}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          {route.stats.criticalHazards} critical hazards
                        </p>
                        <p className="text-sm font-bold" style={{ color: route.color }}>
                          {route.stats.safetyRating}
                        </p>
                      </div>
                    </button>
                  ))}

                  {selectedRoute && (
                    <button
                      onClick={handleConfirmRoute}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">navigation</span>
                      <span>Start Navigation</span>
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Navigation Mode */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Navigating: {selectedRoute?.name}</h3>
                  <button
                    onClick={handleStopNavigation}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors"
                  >
                    Stop
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-sm opacity-80">Distance</p>
                    <p className="text-2xl font-bold">{selectedRoute?.stats.totalDistance} km</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">ETA</p>
                    <p className="text-2xl font-bold">{selectedRoute?.stats.estimatedMinutes} min</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Safety</p>
                    <p className="text-2xl font-bold">{selectedRoute?.stats.avgSafetyScore}/100</p>
                  </div>
                </div>
              </div>

              {/* Current Instruction */}
              {selectedRoute && selectedRoute.directions[currentStepIndex] && (
                <div className="bg-white border-2 border-cyan-500 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-white text-3xl">
                        {selectedRoute.directions[currentStepIndex].type === 'start'
                          ? 'flag'
                          : selectedRoute.directions[currentStepIndex].type === 'end'
                          ? 'location_on'
                          : 'turn_right'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        Step {currentStepIndex + 1} of {selectedRoute.directions.length}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedRoute.directions[currentStepIndex].instruction}
                      </p>
                      {selectedRoute.directions[currentStepIndex].distanceFromPrev && (
                        <p className="text-sm text-gray-600">
                          Distance: {selectedRoute.directions[currentStepIndex].distanceFromPrev.toFixed(2)} km
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => speakInstruction(selectedRoute.directions[currentStepIndex].instruction)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isSpeaking
                          ? 'bg-orange-500 text-white animate-pulse'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="material-symbols-outlined">volume_up</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={currentStepIndex >= (selectedRoute?.directions.length || 0) - 1}
                  className="flex-1 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>

              {/* All Directions List */}
              <div className="bg-gray-50 rounded-2xl p-4 max-h-64 overflow-y-auto">
                <h4 className="font-bold text-gray-900 mb-3">All Directions</h4>
                <div className="space-y-2">
                  {selectedRoute?.directions.map((dir, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl transition-all ${
                        idx === currentStepIndex
                          ? 'bg-cyan-100 border-2 border-cyan-500'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-cyan-600">{idx + 1}</span>
                        <p className="text-sm font-medium text-gray-800">{dir.instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationEngine;

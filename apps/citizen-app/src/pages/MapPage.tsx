import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import ViosaChatbot from '../components/ViosaChatbot';
import NavigationEngine from '../components/NavigationEngine';
import { RouteOption } from '../utils/enhancedSafeRouteCalculator';
import { calculateDistance } from '../store/issuesStore';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Bengaluru coordinates
const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_ZOOM = 13;

interface Report {
  report_id: number;
  category: string;
  severity: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  estimated_fix_date?: string;
}

interface Notification {
  notification_id: number;
  message: string;
  type: string;
  sent_at: string;
  read_at?: string;
}

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNavigationEngine, setShowNavigationEngine] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showCoordinatePicker, setShowCoordinatePicker] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [activeRoute, setActiveRoute] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedLocation, setHighlightedLocation] = useState<[number, number] | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [currentDirection, setCurrentDirection] = useState<string>('');
  const watchIdRef = useRef<number | null>(null);
  
  // Route state
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number; safetyScore: number }>>([]);
  const [routeStats, setRouteStats] = useState<any>(null);

  // Form state (kept for backward compatibility)
  const [formData, setFormData] = useState({
    category: 'Pothole',
    severity: 5,
    description: '',
    latitude: BENGALURU_CENTER[0],
    longitude: BENGALURU_CENTER[1],
  });

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (showCoordinatePicker) {
          setPickedCoordinates([e.latlng.lat, e.latlng.lng]);
        }
      },
    });
    return null;
  };

  useEffect(() => {
    fetchReports();
    fetchNotifications();
    
    // Connect to Socket.io for real-time updates
    const socket = io('http://localhost:3000');
    
    socket.on('new-report', (data: any) => {
      console.log('New report received:', data);
      fetchReports();
    });
    
    socket.on('report-updated', (data: any) => {
      console.log('Report updated:', data);
      fetchReports();
      fetchNotifications();
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/map/map-data');
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/notifications?unread_only=true');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getMarkerColor = (status: string, severity: number, type: string) => {
    // Hospitals are always pink
    if (type === 'hospital') return '#ec4899'; // pink
    // Police booths are always blue
    if (type === 'police_booth') return '#3b82f6'; // blue
    // Other issues based on status
    if (status === 'Resolved') return '#22c55e'; // green
    if (severity >= 8) return '#ef4444'; // red
    if (severity >= 5) return '#f59e0b'; // orange
    return '#eab308'; // yellow
  };

  const getMarkerIcon = (type: string) => {
    if (type === 'hospital') return '🏥';
    if (type === 'police_booth') return '👮';
    if (type === 'pothole') return '🕳️';
    if (type === 'streetlight') return '💡';
    return '⚠️';
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(location);
          setFormData({ ...formData, latitude: location[0], longitude: location[1] });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Using Bengaluru center.');
        }
      );
    }
  };

  // Real-time location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsTrackingLocation(true);
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(newLocation);
        
        // Update direction if navigating
        if (activeRoute && activeRoute.path && activeRoute.path.length > 0) {
          updateNavigationDirection(newLocation);
        }
      },
      (error) => {
        console.error('Error tracking location:', error);
        setIsTrackingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTrackingLocation(false);
    setCurrentDirection('');
  };

  const updateNavigationDirection = (currentLoc: [number, number]) => {
    if (!activeRoute || !activeRoute.path || activeRoute.path.length === 0) return;

    // Find nearest point on route
    let nearestPoint = activeRoute.path[0];
    let minDistance = calculateDistance(
      { lat: currentLoc[0], lng: currentLoc[1] },
      { lat: nearestPoint.lat, lng: nearestPoint.lng }
    );
    let nearestIndex = 0;

    activeRoute.path.forEach((point: any, index: number) => {
      const dist = calculateDistance(
        { lat: currentLoc[0], lng: currentLoc[1] },
        { lat: point.lat, lng: point.lng }
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestPoint = point;
        nearestIndex = index;
      }
    });

    // Get next point for direction
    if (nearestIndex < activeRoute.path.length - 1) {
      const nextPoint = activeRoute.path[nearestIndex + 1];
      const bearing = calculateBearing(
        { lat: currentLoc[0], lng: currentLoc[1] },
        { lat: nextPoint.lat, lng: nextPoint.lng }
      );
      const direction = getDirectionFromBearing(bearing);
      const distance = minDistance * 1000; // Convert to meters

      if (distance < 50) {
        setCurrentDirection(`Continue ${direction}`);
      } else if (distance < 100) {
        setCurrentDirection(`In ${Math.round(distance)}m, turn ${direction}`);
      } else {
        setCurrentDirection(`Follow route ${direction} for ${(minDistance).toFixed(1)}km`);
      }
    } else {
      setCurrentDirection('You are approaching your destination');
    }
  };

  const calculateBearing = (start: { lat: number; lng: number }, end: { lat: number; lng: number }): number => {
    const startLat = start.lat * Math.PI / 180;
    const startLng = start.lng * Math.PI / 180;
    const endLat = end.lat * Math.PI / 180;
    const endLng = end.lng * Math.PI / 180;

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;

    return (bearing + 360) % 360;
  };

  const getDirectionFromBearing = (bearing: number): string => {
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  };

  // Location search using Nominatim API
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Bengaluru, India')}&format=json&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setHighlightedLocation([lat, lng]);
    setSearchResults([]);
    setSearchQuery(result.display_name);
    
    // Optionally, you can also set this as picked coordinates
    setPickedCoordinates([lat, lng]);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cleanup location tracking on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const clearRoute = () => {
    setDestination(null);
    setRoutePoints([]);
    setRouteStats(null);
    setActiveRoute(null);
  };

  const getNearbyReports = () => {
    if (!userLocation) return [];
    const searchRadius = 5000; // 5km
    return reports.filter(report => {
      const distance = calculateDistance(
        { lat: userLocation[0], lng: userLocation[1] },
        { lat: report.latitude, lng: report.longitude }
      );
      return distance <= searchRadius;
    });
  };

  const handleRouteConfirm = (route: any) => {
    setActiveRoute(route);
    setRoutePoints(route.path);
    setRouteStats(route.stats);
    
    // Set destination
    if (route.path.length > 0) {
      const lastPoint = route.path[route.path.length - 1];
      setDestination([lastPoint.lat, lastPoint.lng]);
    }
    
    setShowNavigationEngine(false);
  };

  const handleRouteSelection = (route: any) => {
    // For Viosa chatbot integration
    const points = route.waypoints?.map((wp: any) => ({
      lat: wp.lat,
      lng: wp.lng,
      safetyScore: wp.safetyScore || route.safetyScore
    })) || route.path;
    
    setActiveRoute({
      path: points,
      stats: {
        distanceKm: route.distance,
        estimatedMinutes: route.estimatedTime,
        avgSafetyScore: route.safetyScore,
        safetyRating: route.recommendation
      },
      color: route.color,
      name: route.name
    });
    
    setRoutePoints(points);
    setRouteStats({
      distanceKm: route.distance,
      estimatedMinutes: route.estimatedTime,
      avgSafetyScore: route.safetyScore,
      safetyRating: route.recommendation
    });
    
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      setDestination([lastPoint.lat, lastPoint.lng]);
    }
  };

  return (
    <div className="relative h-screen w-full bg-gray-50 overflow-hidden">
      {/* Modern Header with Glass Effect */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img 
              src="/WinGuard_Logo.png" 
              alt="WinGuard Logo" 
              className="h-12 w-auto drop-shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Win</span>
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Guard</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Welcome, {user?.fullName || 'User'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Viosa AI Assistant Button */}
            <button
              onClick={() => setShowChatbot(true)}
              className="relative p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl transition-all duration-200 group"
              title="Viosa AI Assistant"
            >
              <div className="relative">
                <svg className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
              </div>
            </button>
            <button
              onClick={() => {
                setShowCoordinatePicker(!showCoordinatePicker);
                if (!showCoordinatePicker) {
                  setPickedCoordinates(null);
                }
              }}
              className={`p-3 rounded-xl transition-all duration-200 group ${
                showCoordinatePicker ? 'bg-purple-100' : 'hover:bg-purple-50'
              }`}
              title="Pick Coordinates"
            >
              <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${
                showCoordinatePicker ? 'text-purple-600' : 'text-purple-600'
              }`}>
                pin_drop
              </span>
            </button>
            <button
              onClick={() => setShowNavigationEngine(true)}
              className="p-3 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
              title="Guardian Path Navigator"
            >
              <span className="material-symbols-outlined text-blue-600 group-hover:scale-110 transition-transform">explore</span>
            </button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-gray-700">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </button>
            <button
              onClick={logout}
              className="p-3 hover:bg-red-50 rounded-xl transition-all duration-200 group"
              title="Logout"
            >
              <span className="material-symbols-outlined text-red-600 group-hover:scale-110 transition-transform">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Map */}
      <MapContainer
        center={BENGALURU_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map click handler for coordinate picking */}
        <MapClickHandler />
        
        {/* Picked coordinate marker */}
        {pickedCoordinates && (
          <Marker
            position={pickedCoordinates}
            icon={L.divIcon({
              className: 'custom-marker',
              html: '<div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-center; color: white; font-size: 20px; animation: pulse 2s infinite;">📍</div>',
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            })}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold mb-1">Selected Location</p>
                <p className="text-xs text-gray-600">
                  {pickedCoordinates[0].toFixed(6)}, {pickedCoordinates[1].toFixed(6)}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${pickedCoordinates[0].toFixed(6)}, ${pickedCoordinates[1].toFixed(6)}`);
                    alert('Coordinates copied to clipboard!');
                  }}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600"
                >
                  Copy Coordinates
                </button>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Highlighted search location marker */}
        {highlightedLocation && (
          <>
            <Marker
              position={highlightedLocation}
              icon={L.divIcon({
                className: 'custom-marker',
                html: '<div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); width: 48px; height: 48px; border-radius: 50%; border: 4px solid white; box-shadow: 0 6px 16px rgba(0,0,0,0.4); display: flex; align-items: center; justify-center; color: white; font-size: 24px; animation: bounce 1s infinite;">📍</div>',
                iconSize: [48, 48],
                iconAnchor: [24, 24],
              })}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold mb-1">Search Result</p>
                  <p className="text-xs text-gray-600">
                    {highlightedLocation[0].toFixed(6)}, {highlightedLocation[1].toFixed(6)}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${highlightedLocation[0].toFixed(6)}, ${highlightedLocation[1].toFixed(6)}`);
                      alert('Coordinates copied to clipboard!');
                    }}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600"
                  >
                    Copy Coordinates
                  </button>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={highlightedLocation}
              radius={200}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 3 }}
            />
          </>
        )}
        
        {/* User location */}
        {userLocation && (
          <>
            <Marker position={userLocation}>
              <Popup>
                <div className="text-sm font-semibold">Your Location</div>
              </Popup>
            </Marker>
            <Circle
              center={userLocation}
              radius={5000}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 2, dashArray: '10, 10' }}
            />
          </>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={destination}
            icon={L.divIcon({
              className: 'custom-marker',
              html: '<div style="background: linear-gradient(135deg, #10b981, #059669); width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-center; color: white; font-size: 20px;">🎯</div>',
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            })}
          >
            <Popup>
              <div className="text-sm font-semibold">Destination</div>
            </Popup>
          </Marker>
        )}

        {/* Route visualization with color based on route type - NO CIRCLES */}
        {routePoints.length > 0 && activeRoute && (
          <Polyline
            positions={routePoints.map(p => [p.lat, p.lng])}
            pathOptions={{
              color: activeRoute.color || '#10b981',
              weight: 6,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Reports */}
        {reports.map((report) => (
          <Marker
            key={report.report_id}
            position={[report.latitude, report.longitude]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="background: ${getMarkerColor(report.status, report.severity, report.category.toLowerCase())}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-center; font-size: 18px;">${getMarkerIcon(report.category.toLowerCase())}</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>{getMarkerIcon(report.category.toLowerCase())}</span>
                  {report.category}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                <p className="text-xs mt-2">
                  <span className={`px-2 py-1 rounded-full font-medium ${
                    report.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                    report.status === 'In Progress' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                </p>
                {report.estimated_fix_date && (
                  <p className="text-xs mt-2 text-blue-600 font-medium">
                    Est. Fix: {new Date(report.estimated_fix_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Modern Floating Search */}
      <div className="absolute top-24 left-0 right-0 px-6 z-[999] pointer-events-none">
        <div className="max-w-2xl mx-auto space-y-4 pointer-events-auto">
          {/* Search Bar */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-200">
            <div className="flex items-center px-5 py-4">
              <span className="material-symbols-outlined text-gray-400 mr-3">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full text-gray-800 placeholder-gray-400 font-medium outline-none"
                placeholder="Search location in Bengaluru..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="border-t border-gray-200 max-h-64 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600 mt-0.5">location_on</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{result.display_name.split(',')[0]}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{result.display_name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Floating Action Buttons */}
      <div className="absolute bottom-28 right-6 flex flex-col gap-3 z-[999]">
        {isTrackingLocation ? (
          <button
            onClick={stopLocationTracking}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 hover:shadow-2xl animate-pulse"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              gps_off
            </span>
          </button>
        ) : (
          <button
            onClick={startLocationTracking}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 hover:shadow-2xl"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              gps_fixed
            </span>
          </button>
        )}
        <button
          onClick={getUserLocation}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 hover:shadow-2xl"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            my_location
          </span>
        </button>
      </div>

      {/* Real-time Direction Display */}
      {isTrackingLocation && currentDirection && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-[999] pointer-events-auto">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white animate-slide-down">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl animate-pulse">navigation</span>
              <div>
                <p className="text-xs font-bold opacity-80 uppercase">Next Direction</p>
                <p className="text-lg font-bold">{currentDirection}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Legend */}
      <div className="absolute bottom-28 left-6 z-[999]">
        <div className="bg-white shadow-xl p-5 rounded-2xl border border-gray-200 max-w-[240px]">
          <h3 className="font-bold text-xs text-gray-500 mb-3 uppercase tracking-wider">
            Map Legend
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
              <span className="text-sm text-gray-700 font-medium">Safe / Resolved</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-orange-400 shadow-sm"></div>
              <span className="text-sm text-gray-700 font-medium">Moderate Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm"></div>
              <span className="text-sm text-gray-700 font-medium">High Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm"></div>
              <span className="text-sm text-gray-700 font-medium">👮 Police Booth</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-pink-500 shadow-sm"></div>
              <span className="text-sm text-gray-700 font-medium">🏥 Hospital</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-20 right-6 w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl z-[1001] overflow-hidden border border-gray-200">
          <div className="p-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Notifications</h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[400px] p-4 space-y-3">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No new notifications</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notification_id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <p className="text-sm text-gray-800 font-medium">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notif.sent_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Navigation Engine Component */}
      <NavigationEngine
        isOpen={showNavigationEngine}
        onClose={() => setShowNavigationEngine(false)}
        userLocation={userLocation}
        onRouteConfirm={handleRouteConfirm}
      />

      {/* Modern Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 z-[1000] bg-white shadow-2xl rounded-t-3xl border-t border-gray-200">
        <div className="flex justify-around items-center px-6 py-4">
          <button
            onClick={() => navigate('/map')}
            className="flex flex-col items-center bg-blue-50 text-blue-600 rounded-2xl px-5 py-2 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            <span className="text-xs font-bold mt-1">Map</span>
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="text-xs font-bold mt-1">Alerts</span>
          </button>
          <button
            onClick={() => navigate('/stats')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-xs font-bold mt-1">Stats</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-xs font-bold mt-1">Profile</span>
          </button>
        </div>
      </nav>

      {/* Viosa Chatbot Component */}
      <ViosaChatbot
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        userLocation={userLocation || undefined}
        nearbyReports={getNearbyReports()}
        onRouteSelect={handleRouteSelection}
      />

      {/* Coordinate Picker Panel */}
      {showCoordinatePicker && (
        <div className="absolute top-32 left-6 z-[999] pointer-events-auto">
          <div className="bg-white shadow-xl p-5 rounded-2xl border border-gray-200 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">pin_drop</span>
                Pick Coordinates
              </h3>
              <button
                onClick={() => {
                  setShowCoordinatePicker(false);
                  setPickedCoordinates(null);
                }}
                className="p-1 hover:bg-red-50 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-red-600 text-sm">close</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-600 mb-4 bg-purple-50 p-3 rounded-xl border border-purple-200">
              📍 Click anywhere on the map to get coordinates
            </p>
            
            {pickedCoordinates ? (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Latitude</p>
                  <p className="font-bold text-lg text-gray-900">{pickedCoordinates[0].toFixed(6)}</p>
                  <p className="text-xs text-gray-600 mt-2 mb-1">Longitude</p>
                  <p className="font-bold text-lg text-gray-900">{pickedCoordinates[1].toFixed(6)}</p>
                </div>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${pickedCoordinates[0].toFixed(6)}, ${pickedCoordinates[1].toFixed(6)}`);
                    alert('Coordinates copied to clipboard!');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy Coordinates
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-gray-300 text-6xl mb-2">location_searching</span>
                <p className="text-sm text-gray-500">Waiting for map click...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Route Info Panel - Shows active route details */}
      {activeRoute && routeStats && (
        <div className="absolute top-32 right-6 z-[999] pointer-events-auto">
          <div className="bg-white shadow-xl p-5 rounded-2xl border border-gray-200 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: activeRoute.color }}>route</span>
                {activeRoute.name || 'Active Route'}
              </h3>
              <button
                onClick={clearRoute}
                className="p-1 hover:bg-red-50 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-red-600 text-sm">close</span>
              </button>
            </div>
            
            {/* Prominent Time Display */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl mb-3 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">Estimated Time</p>
                  <p className="text-4xl font-bold text-blue-900">{routeStats.estimatedMinutes}</p>
                  <p className="text-sm text-blue-600 font-medium">minutes</p>
                </div>
                <span className="material-symbols-outlined text-blue-600 text-5xl">schedule</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-4 rounded-xl space-y-2 border border-gray-200">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 font-medium">Distance:</span>
                <span className="font-bold text-gray-900">{routeStats.distanceKm || routeStats.totalDistance} km</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 font-medium">Safety Score:</span>
                <span className={`font-bold ${
                  routeStats.avgSafetyScore >= 80 ? 'text-green-600' :
                  routeStats.avgSafetyScore >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {routeStats.avgSafetyScore}/100
                </span>
              </div>
              <div className="pt-2 border-t border-gray-300">
                <span className="text-xs font-bold text-gray-800">{routeStats.safetyRating}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import ViosaChatbot from '../components/ViosaChatbot';
import EnhancedReportForm from '../components/EnhancedReportForm';
import RouteSelector from '../components/RouteSelector';
import {
  calculateSafeRoute,
  calculateRouteStats,
  generateInstructions,
  generateSafetyHeatmap,
  calculateDistance
} from '../utils/safeRouteCalculator';

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
  const [showReportForm, setShowReportForm] = useState(false);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [safeRouteMode, setSafeRouteMode] = useState(true);
  
  // Route state
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number; safetyScore: number }>>([]);
  const [routeStats, setRouteStats] = useState<any>(null);
  const [instructions, setInstructions] = useState<string[]>([]);
  
  // Heatmap state
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Array<{ lat: number; lng: number; intensity: number }>>([]);

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
        if (!destination && userLocation) {
          setDestination([e.latlng.lat, e.latlng.lng]);
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

  const getMarkerColor = (status: string, severity: number) => {
    if (status === 'Resolved') return '#22c55e'; // green
    if (severity >= 8) return '#ef4444'; // red
    if (severity >= 5) return '#f59e0b'; // orange
    return '#eab308'; // yellow
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
          
          // Generate heatmap around user location
          if (reports.length > 0) {
            const searchRadius = 5000; // 5km
            const heatmap = generateSafetyHeatmap(
              { lat: location[0], lng: location[1] },
              searchRadius,
              reports,
              15
            );
            setHeatmapData(heatmap);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Using Bengaluru center.');
        }
      );
    }
  };

  const calculateRoute = () => {
    if (!userLocation || !destination) {
      alert('Please set both start and destination points');
      return;
    }

    // Calculate both safe and fast routes
    const safeRoute = calculateSafeRoute(
      { lat: userLocation[0], lng: userLocation[1] },
      { lat: destination[0], lng: destination[1] },
      reports,
      true // Safe mode
    );

    const fastRoute = calculateSafeRoute(
      { lat: userLocation[0], lng: userLocation[1] },
      { lat: destination[0], lng: destination[1] },
      reports,
      false // Fast mode
    );

    setRoutePoints(safeRouteMode ? safeRoute : fastRoute);
    
    const stats = calculateRouteStats(safeRouteMode ? safeRoute : fastRoute);
    setRouteStats(stats);
    
    const turnInstructions = generateInstructions(safeRouteMode ? safeRoute : fastRoute);
    setInstructions(turnInstructions);
  };

  const clearRoute = () => {
    setDestination(null);
    setRoutePoints([]);
    setRouteStats(null);
    setInstructions([]);
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

  const handleRouteSelection = (route: any) => {
    // Convert route waypoints to the format expected by the map
    const points = route.waypoints.map((wp: any) => ({
      lat: wp.lat,
      lng: wp.lng,
      safetyScore: route.safetyScore
    }));
    
    setRoutePoints(points);
    setRouteStats({
      distanceKm: route.distance,
      estimatedMinutes: route.estimatedTime,
      avgSafetyScore: route.safetyScore,
      safetyRating: route.recommendation
    });
    
    // Set destination from route
    if (route.waypoints.length > 0) {
      const lastPoint = route.waypoints[route.waypoints.length - 1];
      setDestination([lastPoint.lat, lastPoint.lng]);
    }
    
    // Update safe route mode based on route type
    if (route.routeType === 'safest') {
      setSafeRouteMode(true);
    } else if (route.routeType === 'fastest') {
      setSafeRouteMode(false);
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
            <button
              onClick={() => setShowRouteSelector(true)}
              className="p-3 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
              title="Route Planner"
            >
              <span className="material-symbols-outlined text-blue-600 group-hover:scale-110 transition-transform">route</span>
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
        
        {/* Map click handler for setting destination */}
        <MapClickHandler />
        
        {/* Heatmap overlay */}
        {showHeatmap && heatmapData.map((point, idx) => (
          <Circle
            key={`heat-${idx}`}
            center={[point.lat, point.lng]}
            radius={200}
            pathOptions={{
              fillColor: point.intensity > 0.7 ? '#ef4444' : point.intensity > 0.4 ? '#f59e0b' : '#10b981',
              fillOpacity: point.intensity * 0.4,
              stroke: false
            }}
          />
        ))}
        
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

        {/* Route visualization with gradient based on safety */}
        {routePoints.length > 0 && (
          <>
            <Polyline
              positions={routePoints.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: safeRouteMode ? '#10b981' : '#3b82f6',
                weight: 8,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Safety indicators along route - larger and more visible */}
            {routePoints.filter((_, idx) => idx % 2 === 0).map((point, idx) => (
              <Circle
                key={`route-${idx}`}
                center={[point.lat, point.lng]}
                radius={80}
                pathOptions={{
                  fillColor: point.safetyScore >= 70 ? '#10b981' : point.safetyScore >= 40 ? '#f59e0b' : '#ef4444',
                  fillOpacity: 0.6,
                  color: point.safetyScore >= 70 ? '#059669' : point.safetyScore >= 40 ? '#d97706' : '#dc2626',
                  weight: 2,
                }}
              />
            ))}
          </>
        )}

        {/* Reports */}
        {reports.map((report) => (
          <Marker
            key={report.report_id}
            position={[report.latitude, report.longitude]}
            icon={createCustomIcon(getMarkerColor(report.status, report.severity))}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-base">{report.category}</h3>
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

      {/* Modern Floating Search & Route Toggle */}
      <div className="absolute top-24 left-0 right-0 px-6 z-[999] pointer-events-none">
        <div className="max-w-2xl mx-auto space-y-4 pointer-events-auto">
          {/* Search Bar */}
          <div className="bg-white shadow-xl rounded-2xl flex items-center px-5 py-4 border border-gray-200">
            <span className="material-symbols-outlined text-gray-400 mr-3">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 w-full text-gray-800 placeholder-gray-400 font-medium"
              placeholder="Search location in Bengaluru..."
              type="text"
            />
          </div>

          {/* Route Mode Toggle - Modern Design */}
          <div className="flex justify-center">
            <div className="bg-white shadow-xl p-1.5 rounded-2xl flex gap-2 border border-gray-200">
              <button
                onClick={() => {
                  setSafeRouteMode(true);
                  if (routePoints.length > 0) calculateRoute();
                }}
                className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200 ${
                  safeRouteMode
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">verified_user</span>
                Safe Route
              </button>
              <button
                onClick={() => {
                  setSafeRouteMode(false);
                  if (routePoints.length > 0) calculateRoute();
                }}
                className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-200 ${
                  !safeRouteMode
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">speed</span>
                Fast Route
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Floating Action Buttons */}
      <div className="absolute bottom-28 right-6 flex flex-col gap-3 z-[999]">
        <button
          onClick={getUserLocation}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 hover:shadow-2xl"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            my_location
          </span>
        </button>
        <button
          onClick={() => setShowReportForm(true)}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 hover:shadow-2xl"
        >
          <span className="material-symbols-outlined text-3xl">add_alert</span>
        </button>
      </div>

      {/* Modern Legend */}
      <div className="absolute bottom-28 left-6 z-[999]">
        <div className="bg-white shadow-xl p-5 rounded-2xl border border-gray-200 max-w-[220px]">
          <h3 className="font-bold text-xs text-gray-500 mb-3 uppercase tracking-wider">
            Safety Index
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

      {/* Enhanced Report Form Component */}
      <EnhancedReportForm
        isOpen={showReportForm}
        onClose={() => setShowReportForm(false)}
        onSuccess={fetchReports}
        defaultLocation={userLocation ? { latitude: userLocation[0], longitude: userLocation[1] } : undefined}
      />

      {/* Route Selector Component */}
      <RouteSelector
        isOpen={showRouteSelector}
        onClose={() => setShowRouteSelector(false)}
        onRouteSelect={handleRouteSelection}
        userLocation={userLocation}
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

      {/* Modern Viosa Chatbot Button */}
      <button 
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-32 right-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 z-[1000] animate-pulse"
      >
        <span className="material-symbols-outlined text-3xl">smart_toy</span>
      </button>

      {/* Viosa Chatbot Component */}
      <ViosaChatbot
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        userLocation={userLocation || undefined}
        nearbyReports={getNearbyReports()}
      />

      {/* Modern Route Control Panel */}
      {userLocation && (
        <div className="absolute top-48 right-6 z-[999] pointer-events-auto">
          <div className="bg-white shadow-xl p-5 rounded-2xl border border-gray-200 w-72">
            <h3 className="font-bold text-sm text-gray-700 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">route</span>
              Route Planning
            </h3>
            
            {!destination ? (
              <p className="text-xs text-gray-500 mb-3 bg-blue-50 p-3 rounded-xl border border-blue-200">
                Click on the map to set your destination
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-700 bg-green-50 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-green-600 text-sm">location_on</span>
                  <span className="font-medium">Destination set</span>
                </div>
                
                {routeStats && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl space-y-2 border border-gray-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">Distance:</span>
                      <span className="font-bold text-gray-900">{routeStats.distanceKm} km</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">Time:</span>
                      <span className="font-bold text-gray-900">{routeStats.estimatedMinutes} min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">Safety:</span>
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
                )}
                
                <div className="flex gap-2">
                  {!routePoints.length ? (
                    <button
                      onClick={calculateRoute}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">directions</span>
                      Calculate
                    </button>
                  ) : (
                    <button
                      onClick={clearRoute}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Clear
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    showHeatmap
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {showHeatmap ? 'visibility_off' : 'visibility'}
                  </span>
                  {showHeatmap ? 'Hide' : 'Show'} Heatmap
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Turn-by-Turn Instructions Panel */}
      {instructions.length > 0 && (
        <div className="absolute top-48 left-6 z-[999] pointer-events-auto max-w-xs">
          <div className="bg-white shadow-xl p-5 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">navigation</span>
                Navigation
              </h3>
              <button
                onClick={() => setInstructions([])}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {instructions.map((instruction, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-800 border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <span className="text-blue-600 font-bold min-w-[20px]">{idx + 1}.</span>
                  <span className="font-medium">{instruction}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;

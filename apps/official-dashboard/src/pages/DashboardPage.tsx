import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '../store/authStore';
import { useIssuesStore, Issue } from '../store/issuesStore';
import 'leaflet/dist/leaflet.css';

// Custom marker icons with glowing effect
const createGlowingIcon = (icon: string, status: 'critical' | 'in_progress' | 'resolved') => {
  const glowColor = status === 'critical' ? '#ef4444' : status === 'in_progress' ? '#3b82f6' : '#10b981';
  const bgColor = status === 'critical' ? '#dc2626' : status === 'in_progress' ? '#2563eb' : '#059669';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div style="
          position: absolute;
          width: 50px;
          height: 50px;
          background: ${glowColor};
          border-radius: 50%;
          opacity: 0.4;
          animation: pulse 2s infinite;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
        <div style="
          position: relative;
          background: ${bgColor};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 20px ${glowColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          z-index: 1;
        ">${icon}</div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
      </style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

interface CitizenReport {
  report_id: number;
  category: string;
  severity: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  photo_url?: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { issues, updateIssueStatus, addIssue, getStats } = useIssuesStore();
  const stats = getStats();
  
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [simulationMode, setSimulationMode] = useState<'install' | null>(null);
  const [installType, setInstallType] = useState<'streetlight' | 'police_booth' | null>(null);
  const [clickedLocation, setClickedLocation] = useState<[number, number] | null>(null);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Fetch citizen reports from API
  useEffect(() => {
    fetchCitizenReports();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCitizenReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCitizenReports = async () => {
    try {
      const response = await fetch('/api/reports/all');
      const data = await response.json();
      if (data.success && data.data && data.data.reports) {
        setCitizenReports(data.data.reports);
      }
    } catch (error) {
      console.error('Error fetching citizen reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Default center (Bengaluru, India)
  const mapCenter: [number, number] = [12.9716, 77.5946];
  const mapZoom = 13;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStatusChange = async (issueId: number, newStatus: 'in_progress' | 'resolved') => {
    const issue = issues.find(i => i.id === issueId);
    
    updateIssueStatus(issueId, newStatus);

    // Send notification to citizen app
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          message: `${issue?.description} - Status updated to ${newStatus === 'in_progress' ? 'In Progress' : 'Resolved'}`,
          type: newStatus === 'resolved' ? 'success' : 'info'
        })
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const confirmInstallation = async () => {
    if (clickedLocation && installType) {
      const newIssue: Issue = {
        id: Date.now(),
        type: installType,
        latitude: clickedLocation[0],
        longitude: clickedLocation[1],
        status: 'resolved',
        description: `New ${installType === 'streetlight' ? 'streetlight' : 'police booth'} installed`,
        reportedAt: 'Just now',
        severity: 0
      };
      addIssue(newIssue);
      
      // Send notification
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 1,
            message: `New ${installType === 'streetlight' ? 'streetlight' : 'police booth'} installed in your area`,
            type: 'success'
          })
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
      
      setSimulationMode(null);
      setInstallType(null);
      setClickedLocation(null);
    }
  };

  const handleInstallNew = (type: 'streetlight' | 'police_booth') => {
    setSimulationMode('install');
    setInstallType(type);
    setClickedLocation(null);
  };

  const cancelInstallation = () => {
    setSimulationMode(null);
    setInstallType(null);
    setClickedLocation(null);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e: any) => {
        if (simulationMode === 'install') {
          setClickedLocation([e.latlng.lat, e.latlng.lng]);
        }
      },
    });
    return null;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'pothole':
      case 'Pothole':
      case 'Road Crack':
        return '⚠️';
      case 'streetlight':
      case 'Streetlight':
        return '💡';
      case 'police_booth':
      case 'Police Booth':
        return '🚔';
      case 'hospital':
      case 'Hospital':
        return '🏥';
      default:
        return '📍';
    }
  };

  const activeIssuesCount = stats.critical + stats.inProgress;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col py-6 h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 z-50">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <img 
              src="/WinGuard_Logo.png" 
              alt="WinGuard Logo" 
              className="h-10 w-auto"
            />
          </div>
          <div className="mt-6 p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div>
              <p className="font-bold text-sm">Admin</p>
              <p className="text-xs text-gray-600">Safety Officer</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-teal-600 font-bold bg-teal-50 border-l-4 border-teal-600 w-full text-left">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span className="text-sm">Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/stats')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span className="text-sm font-medium">Statistics</span>
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <span className="text-sm font-medium">Reports</span>
          </button>
          <button 
            onClick={() => navigate('/issues')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span className="text-sm font-medium">Issues</span>
          </button>
          <button 
            onClick={() => navigate('/simulations')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
            <span className="text-sm font-medium">Simulations</span>
          </button>
          <button 
            onClick={() => navigate('/safety-scores')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-sm font-medium">🎨 Safety Scores</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-sm font-medium">Heatmaps</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen pb-8">
        {/* TopAppBar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="md:hidden w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <h1 className="text-xl font-bold text-gray-900">Command Center</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                  <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                  <span className="text-xs font-bold text-teal-700">Live System Monitoring</span>
                </div>
                <div className="relative">
                  <svg className="w-6 h-6 text-gray-600 cursor-pointer hover:text-teal-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                  </svg>
                  <span className="absolute top-0 right-0 w-2 h-2 bg-orange-600 rounded-full"></span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          {/* Dashboard Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-600 text-xs uppercase tracking-wider font-bold">Total Issues</p>
              <div className="flex items-end justify-between mt-2">
                <h2 className="text-3xl font-bold text-teal-600">{stats.total}</h2>
                <span className="text-teal-600 font-bold text-sm">All</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-orange-600">
              <p className="text-gray-600 text-xs uppercase tracking-wider font-bold">Potholes</p>
              <div className="flex items-end justify-between mt-2">
                <h2 className="text-3xl font-bold text-gray-900">{stats.potholes}</h2>
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
              <p className="text-gray-600 text-xs uppercase tracking-wider font-bold">Critical</p>
              <div className="flex items-end justify-between mt-2">
                <h2 className="text-3xl font-bold text-gray-900">{stats.critical}</h2>
                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-teal-600">
              <p className="text-gray-600 text-xs uppercase tracking-wider font-bold">Streetlights</p>
              <div className="flex items-end justify-between mt-2">
                <h2 className="text-3xl font-bold text-gray-900">{stats.streetlights}</h2>
                <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                </svg>
              </div>
            </div>
          </section>

          {/* Digital Twin Map */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Digital Twin Command Center</h3>
                <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mt-1">Real-time City Monitoring & Simulation</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Installation Mode Buttons */}
                <button 
                  onClick={() => handleInstallNew('streetlight')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border-2 transition-all ${
                    simulationMode === 'install' && installType === 'streetlight'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-lg'
                      : 'bg-white text-teal-700 border-teal-300 hover:border-teal-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                  </svg>
                  Install Streetlight
                </button>
                <button 
                  onClick={() => handleInstallNew('police_booth')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border-2 transition-all ${
                    simulationMode === 'install' && installType === 'police_booth'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-white text-blue-700 border-blue-300 hover:border-blue-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  Install Police Booth
                </button>
                {simulationMode === 'install' && (
                  <button 
                    onClick={cancelInstallation}
                    className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 transition-all"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Cancel
                  </button>
                )}
              </div>
            </div>
            
            {/* Installation Instructions */}
            {simulationMode === 'install' && (
              <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      Click on the map to place a new {installType === 'streetlight' ? 'streetlight' : 'police booth'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {clickedLocation 
                        ? `Selected location: ${clickedLocation[0].toFixed(4)}, ${clickedLocation[1].toFixed(4)}` 
                        : 'No location selected yet'}
                    </p>
                  </div>
                  {clickedLocation && (
                    <button
                      onClick={confirmInstallation}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                      </svg>
                      Confirm Installation
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="h-[600px] relative">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="h-full w-full"
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapClickHandler />
                
                {/* Render all issues with glowing markers */}
                {issues.map((issue) => (
                  <Marker
                    key={issue.id}
                    position={[issue.latitude, issue.longitude]}
                    icon={createGlowingIcon(getIconForType(issue.type), issue.status)}
                  >
                    <Popup>
                      <div className="text-sm min-w-[250px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getIconForType(issue.type)}</span>
                          <div>
                            <p className="font-bold text-gray-900 capitalize">{issue.type.replace('_', ' ')}</p>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              issue.status === 'critical' 
                                ? 'bg-red-100 text-red-700'
                                : issue.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {issue.status === 'critical' ? 'Critical' : issue.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{issue.description}</p>
                        <p className="text-xs text-gray-500 mb-3">Reported {issue.reportedAt}</p>
                        
                        {/* Status Change Buttons */}
                        {issue.status !== 'resolved' && (
                          <div className="flex flex-col gap-2">
                            {issue.status === 'critical' && (
                              <button
                                onClick={() => handleStatusChange(issue.id, 'in_progress')}
                                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                Start Fixing
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(issue.id, 'resolved')}
                              className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                              </svg>
                              Mark as Resolved
                            </button>
                          </div>
                        )}
                        {issue.status === 'resolved' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                            </svg>
                            <span className="text-xs font-bold">Issue Resolved</span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Render citizen reports as markers */}
                {citizenReports.map((report) => (
                  <Marker
                    key={`report-${report.report_id}`}
                    position={[report.latitude, report.longitude]}
                    icon={createGlowingIcon(getIconForType(report.category), report.status.toLowerCase() === 'resolved' ? 'resolved' : 'critical')}
                  >
                    <Popup>
                      <div className="text-sm min-w-[250px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getIconForType(report.category)}</span>
                          <div>
                            <p className="font-bold text-gray-900">{report.category}</p>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                              Citizen Report
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{report.description}</p>
                        <p className="text-xs text-gray-500 mb-2">Severity: {report.severity}/10</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Reported {new Date(report.created_at).toLocaleString()}
                        </p>
                        
                        {report.photo_url && (
                          <img 
                            src={report.photo_url} 
                            alt="Report" 
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        
                        <button
                          onClick={() => navigate('/reports')}
                          className="w-full px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all"
                        >
                          View Full Report
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Temporary marker for installation location */}
                {clickedLocation && simulationMode === 'install' && (
                  <Marker
                    position={clickedLocation}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `
                        <div style="
                          width: 40px;
                          height: 40px;
                          background: linear-gradient(135deg, #10b981, #059669);
                          border-radius: 50%;
                          border: 4px solid white;
                          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.6);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-size: 24px;
                          animation: bounce 1s infinite;
                        ">
                          ${installType === 'streetlight' ? '💡' : '🚔'}
                        </div>
                        <style>
                          @keyframes bounce {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                          }
                        </style>
                      `,
                      iconSize: [40, 40],
                      iconAnchor: [20, 20],
                    })}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold text-green-600">New Installation Location</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {installType === 'streetlight' ? 'Streetlight' : 'Police Booth'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
              
              {/* Map Legend */}
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-4 z-[1000]">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Status Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg"></div>
                    <span className="text-xs font-medium text-gray-700">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600 shadow-lg"></div>
                    <span className="text-xs font-medium text-gray-700">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600 shadow-lg"></div>
                    <span className="text-xs font-medium text-gray-700">Resolved</span>
                  </div>
                </div>
              </div>
              
              {/* Map Overlay Stats */}
              <div className="absolute bottom-6 left-6 right-6 flex gap-4 justify-between items-end z-[1000] pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-xl flex items-center gap-6 shadow-lg border border-gray-200 pointer-events-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-red-600 uppercase font-bold tracking-widest">Active Issues</span>
                    <span className="text-2xl font-semibold text-gray-900">{activeIssuesCount}</span>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-300"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-green-600 uppercase font-bold tracking-widest">Resolved</span>
                    <span className="text-2xl font-semibold text-gray-900">{stats.resolved}</span>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-300"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-teal-600 uppercase font-bold tracking-widest">Total</span>
                    <span className="text-2xl font-semibold text-gray-900">{stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

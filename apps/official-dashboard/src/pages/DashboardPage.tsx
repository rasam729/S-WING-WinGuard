import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
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
  
  // Search and location features
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCoordinatePicker, setShowCoordinatePicker] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<[number, number] | null>(null);
  const [pickedPlaceName, setPickedPlaceName] = useState<string>('');
  const mapRef = useRef<any>(null);

  // Fetch citizen reports from API and convert to issues
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
        const reports = data.data.reports;
        setCitizenReports(reports);
        
        // Convert citizen reports to issues and add to store
        reports.forEach((report: CitizenReport) => {
          // Check if this report is already in issues (by checking if report_id exists)
          const issueId = report.report_id + 10000;
          const existingIssue = issues.find(issue => issue.id === issueId);
          
          // Map category to issue type
          let issueType: 'pothole' | 'streetlight' | 'police_booth' | 'hospital' = 'pothole';
          const category = report.category.toLowerCase();
          
          if (category.includes('pothole') || category.includes('road crack')) {
            issueType = 'pothole';
          } else if (category.includes('streetlight') || category.includes('light')) {
            issueType = 'streetlight';
          } else if (category.includes('police')) {
            issueType = 'police_booth';
          } else if (category.includes('hospital')) {
            issueType = 'hospital';
          }
          
          // Map status to issue status
          let issueStatus: 'critical' | 'in_progress' | 'resolved' = 'critical';
          const status = report.status.toLowerCase();
          
          if (status.includes('resolved') || status === 'resolved') {
            issueStatus = 'resolved';
          } else if (status.includes('progress') || status === 'in progress') {
            issueStatus = 'in_progress';
          } else {
            issueStatus = 'critical';
          }
          
          // Calculate time ago
          const reportDate = new Date(report.created_at);
          const now = new Date();
          const diffMs = now.getTime() - reportDate.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          
          let timeAgo = 'Just now';
          if (diffMins < 60) {
            timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
          } else if (diffHours < 24) {
            timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
          } else {
            timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
          }
          
          if (!existingIssue) {
            // Create new issue from citizen report
            const newIssue: Issue = {
              id: issueId,
              type: issueType,
              latitude: report.latitude,
              longitude: report.longitude,
              status: issueStatus,
              description: `${report.category}: ${report.description}`,
              reportedAt: timeAgo,
              severity: report.severity
            };
            
            addIssue(newIssue);
          } else {
            // Update existing issue if status changed
            if (existingIssue.status !== issueStatus) {
              updateIssueStatus(issueId, issueStatus);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching citizen reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Default center (India center for country-wide view)
  const mapCenter: [number, number] = [20.5937, 78.9629]; // Center of India
  const mapZoom = 5; // Zoom level to show all of India

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStatusChange = async (issueId: number, newStatus: 'in_progress' | 'resolved') => {
    const issue = issues.find(i => i.id === issueId);
    
    updateIssueStatus(issueId, newStatus);

    // Send notification to citizen app
    try {
      let message = '';
      let type: 'info' | 'success' = 'info';
      
      if (newStatus === 'in_progress') {
        message = `Good news! We're working on fixing the ${issue?.type.replace('_', ' ')} issue you reported. Our team is on it!`;
        type = 'info';
      } else if (newStatus === 'resolved') {
        message = `Great news! The ${issue?.type.replace('_', ' ')} issue you reported has been resolved. Thank you for helping make Bengaluru safer!`;
        type = 'success';
      }
      
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1, // In production, this would be the actual user who reported it
          report_id: issueId > 10000 ? issueId - 10000 : null, // Link to original report if it's a citizen report
          message: message,
          type: type
        })
      });
      
      // Also update the report status in the database if it's a citizen report
      if (issueId > 10000) {
        const reportId = issueId - 10000;
        await fetch(`/api/reports/${reportId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus === 'resolved' ? 'Resolved' : 'In Progress'
          })
        });
      }
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

  // Enhanced search for places using Nominatim (OpenStreetMap) - Google Maps style
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Try multiple search strategies for better results
      const searches = [
        // Primary search with India filter
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5&addressdetails=1`),
        // Backup search without country filter for better coverage
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', India')}&limit=3&addressdetails=1`)
      ];
      
      const responses = await Promise.all(searches);
      const results1 = await responses[0].json();
      const results2 = await responses[1].json();
      
      // Combine and deduplicate results
      const allResults = [...results1, ...results2];
      const uniqueResults = allResults.filter((result, index, self) =>
        index === self.findIndex((r) => r.place_id === result.place_id)
      );
      
      setSearchResults(uniqueResults.slice(0, 8)); // Show top 8 results
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to basic search
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        setSearchResults(data);
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result selection
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // Fly to location
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 15, {
        duration: 2
      });
    }
    
    setSearchResults([]);
    setSearchQuery('');
  };

  // Reverse geocode to get place name from coordinates
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      setPickedPlaceName(data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setPickedPlaceName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  };

  // Toggle coordinate picker mode
  const toggleCoordinatePicker = () => {
    setShowCoordinatePicker(!showCoordinatePicker);
    setPickedCoordinates(null);
    setPickedPlaceName('');
  };

  // Map reference component
  const MapRefSetter = () => {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    return null;
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e: any) => {
        if (simulationMode === 'install') {
          setClickedLocation([e.latlng.lat, e.latlng.lng]);
        } else if (showCoordinatePicker) {
          const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
          setPickedCoordinates(coords);
          reverseGeocode(coords[0], coords[1]);
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
            <span className="text-sm font-medium">Safety Scores</span>
          </button>
          <button 
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span className="text-sm font-medium">📊 Analytics</span>
          </button>
          <button 
            onClick={() => navigate('/budget')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
            </svg>
            <span className="text-sm font-medium">💰 Budget</span>
          </button>
          <button 
            onClick={() => navigate('/contractors')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="text-sm font-medium">🏗️ Contractors</span>
          </button>
          <button 
            onClick={() => navigate('/maintenance')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
            </svg>
            <span className="text-sm font-medium">🔧 Maintenance</span>
          </button>
          <button 
            onClick={() => navigate('/engineers')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span className="text-sm font-medium">👷 Engineers</span>
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
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Digital Twin Command Center - India</h3>
                  <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mt-1">Real-time Nationwide Monitoring & Simulation</p>
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
                  <button 
                    onClick={toggleCoordinatePicker}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border-2 transition-all ${
                      showCoordinatePicker
                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                        : 'bg-white text-purple-700 border-purple-300 hover:border-purple-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Pick Coordinates
                  </button>
                  {(simulationMode === 'install' || showCoordinatePicker) && (
                    <button 
                      onClick={() => {
                        cancelInstallation();
                        setShowCoordinatePicker(false);
                        setPickedCoordinates(null);
                        setPickedPlaceName('');
                      }}
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
              
              {/* Search Bar */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search for any place in India (e.g., Mumbai, Delhi, Connaught Place)..."
                      className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-300 focus:border-teal-600 focus:outline-none text-sm"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        Search
                      </>
                    )}
                  </button>
                </div>
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{result.display_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {result.lat}, {result.lon}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Coordinate Picker Instructions */}
            {showCoordinatePicker && (
              <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center animate-pulse">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      Click anywhere on the map to get coordinates and place name
                    </p>
                    {pickedCoordinates && (
                      <div className="mt-2 p-3 bg-white rounded-lg border-2 border-purple-300">
                        <p className="text-xs font-bold text-purple-900 mb-1">Selected Location:</p>
                        <p className="text-sm text-gray-700 mb-1">
                          📍 <strong>Coordinates:</strong> {pickedCoordinates[0].toFixed(6)}, {pickedCoordinates[1].toFixed(6)}
                        </p>
                        {pickedPlaceName && (
                          <p className="text-sm text-gray-700">
                            📌 <strong>Place:</strong> {pickedPlaceName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
                
                <MapRefSetter />
                <MapClickHandler />
                
                {/* Render all issues with glowing markers */}
                {issues.map((issue) => {
                  const isCitizenReport = issue.id > 10000;
                  return (
                  <Marker
                    key={issue.id}
                    position={[issue.latitude, issue.longitude]}
                    icon={createGlowingIcon(getIconForType(issue.type), issue.status)}
                  >
                    <Popup>
                      <div className="text-sm min-w-[250px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getIconForType(issue.type)}</span>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 capitalize">{issue.type.replace('_', ' ')}</p>
                            <div className="flex gap-1 mt-1">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                issue.status === 'critical' 
                                  ? 'bg-red-100 text-red-700'
                                  : issue.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {issue.status === 'critical' ? 'Critical' : issue.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                              </span>
                              {isCitizenReport && (
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                  Citizen Report
                                </span>
                              )}
                            </div>
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
                );
                })}
                
                {/* Citizen reports are now converted to issues and rendered above */}
                
                {/* Picked coordinates marker */}
                {pickedCoordinates && showCoordinatePicker && (
                  <Marker
                    position={pickedCoordinates}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `
                        <div style="
                          width: 40px;
                          height: 40px;
                          background: linear-gradient(135deg, #9333ea, #ec4899);
                          border-radius: 50%;
                          border: 4px solid white;
                          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.6);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-size: 24px;
                          animation: bounce 1s infinite;
                        ">
                          📍
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
                        <p className="font-bold text-purple-600 mb-2">Selected Location</p>
                        <p className="text-xs text-gray-700 mb-1">
                          <strong>Coordinates:</strong><br/>
                          {pickedCoordinates[0].toFixed(6)}, {pickedCoordinates[1].toFixed(6)}
                        </p>
                        {pickedPlaceName && (
                          <p className="text-xs text-gray-700">
                            <strong>Place:</strong><br/>
                            {pickedPlaceName}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}
                
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

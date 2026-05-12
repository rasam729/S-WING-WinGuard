import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useAuthStore } from '../store/authStore';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const policeIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23006876"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const streetlightIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2300658f"><circle cx="12" cy="12" r="10"/></svg>'),
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const issueIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23904d00"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [stats] = useState({
    totalActive: 124,
    potholes: 42,
    crimeReports: 8,
    streetlights: 74
  });

  // Default center (Bengaluru, India)
  const mapCenter: [number, number] = [12.9716, 77.5946];
  const mapZoom = 13;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col py-6 h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 z-50">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span className="text-xl font-bold">
              <span className="text-teal-600">Win</span>
              <span className="text-orange-600">Guard</span>
            </span>
          </div>
          <div className="mt-6 p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
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
              <p className="text-gray-600 text-xs uppercase tracking-wider font-bold">Total Active</p>
              <div className="flex items-end justify-between mt-2">
                <h2 className="text-3xl font-bold text-teal-600">{stats.totalActive}</h2>
                <span className="text-teal-600 font-bold text-sm">+12%</span>
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
              <p className="text-gray-600 text-xs uppercase tracking-wider font-bold">Crime Reports</p>
              <div className="flex items-end justify-between mt-2">
                <h2 className="text-3xl font-bold text-gray-900">{stats.crimeReports}</h2>
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
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Digital Twin Command Center</h3>
                <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mt-1">Real-time City Monitoring</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#edeeef] text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-300 hover:border-[#00658f]/50 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
                  </svg>
                  Layers
                </button>
                <button className="bg-[#edeeef] text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-300 hover:border-[#904d00]/50 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                  </svg>
                  Timeline
                </button>
              </div>
            </div>
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
                
                {/* Sample Police Booth - Koramangala */}
                <Marker position={[12.9350, 77.6200]} icon={policeIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-[#006876]">Police Outpost - Koramangala</p>
                      <p className="text-xs text-gray-600">Radius: 500m • Status: Operational</p>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[12.9350, 77.6200]}
                  radius={500}
                  pathOptions={{ color: '#006876', fillColor: '#58e6ff', fillOpacity: 0.1 }}
                />
                
                {/* Sample Streetlights - Indiranagar */}
                <Marker position={[12.9716, 77.6412]} icon={streetlightIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-[#00658f]">Streetlight - Indiranagar</p>
                      <p className="text-xs text-gray-600">Status: Online</p>
                    </div>
                  </Popup>
                </Marker>
                
                {/* Sample Issue - MG Road */}
                <Marker position={[12.9759, 77.6061]} icon={issueIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-[#904d00]">Severe Pothole</p>
                      <p className="text-xs text-gray-600">ID: #WG-9902 • Priority: Critical</p>
                      <p className="text-xs text-gray-600 mt-1">MG Road, Bengaluru</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
              
              {/* Map Overlay Stats */}
              <div className="absolute bottom-6 left-6 right-6 flex gap-4 justify-between items-end z-[1000] pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-xl flex items-center gap-6 shadow-lg border border-gray-200 pointer-events-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#00658f] uppercase font-bold tracking-widest">Active Patrols</span>
                    <span className="text-2xl font-semibold text-gray-900">14 Units</span>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-300"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#904d00] uppercase font-bold tracking-widest">Response Time</span>
                    <span className="text-2xl font-semibold text-gray-900">4.2 min</span>
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

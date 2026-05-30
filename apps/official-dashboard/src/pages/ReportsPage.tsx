import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Report {
  report_id: number;
  user_id: number;
  category: string;
  severity: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  updated_at: string;
  photo_url?: string;
}

// Normalise any status string into one of our three buckets
const normaliseStatus = (raw: string): 'pending' | 'in_progress' | 'resolved' => {
  const s = (raw || '').toLowerCase().trim();
  if (s.includes('resolv') || s === 'completed' || s === 'done' || s === 'fixed') return 'resolved';
  if (s.includes('progress') || s === 'in_progress' || s === 'inprogress' || s === 'working' || s === 'assigned') return 'in_progress';
  return 'pending'; // anything else: pending, report received, submitted, new, etc.
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [allReports, setAllReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/all');
      const data = await response.json();
      if (data.success && data.data?.reports) {
        setAllReports(data.data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredReports = allReports.filter(report => {
    const bucket = normaliseStatus(report.status);
    const matchesFilter = filter === 'all' || bucket === filter;
    const matchesSearch = searchQuery.trim() === '' ||
      report.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // ── Counts for badge display ───────────────────────────────────────────────
  const counts = {
    all:         allReports.length,
    pending:     allReports.filter(r => normaliseStatus(r.status) === 'pending').length,
    in_progress: allReports.filter(r => normaliseStatus(r.status) === 'in_progress').length,
    resolved:    allReports.filter(r => normaliseStatus(r.status) === 'resolved').length
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const getSeverityConfig = (severity: number) => {
    if (severity >= 8) return { bg: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500', label: 'Critical' };
    if (severity >= 5) return { bg: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-500', label: 'High' };
    return { bg: 'bg-yellow-100 text-yellow-700 border-yellow-300', dot: 'bg-yellow-500', label: 'Low' };
  };

  const getStatusConfig = (status: string) => {
    const bucket = normaliseStatus(status);
    switch (bucket) {
      case 'resolved':    return { bg: 'bg-green-100 text-green-700 border-green-300',  dot: 'bg-green-500',  label: 'Resolved',    icon: '✅' };
      case 'in_progress': return { bg: 'bg-blue-100  text-blue-700  border-blue-300',   dot: 'bg-blue-500',   label: 'In Progress', icon: '⚙️' };
      default:            return { bg: 'bg-gray-100  text-gray-700  border-gray-300',   dot: 'bg-gray-500',   label: 'Pending',     icon: '⏳' };
    }
  };

  const tabs: { id: typeof filter; label: string; color: string }[] = [
    { id: 'all',         label: 'All Reports',  color: 'bg-teal-600 text-white' },
    { id: 'pending',     label: 'Pending',      color: 'bg-orange-600 text-white' },
    { id: 'in_progress', label: 'In Progress',  color: 'bg-blue-600 text-white' },
    { id: 'resolved',    label: 'Resolved',     color: 'bg-green-600 text-white' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {[
            { path: '/',            label: 'Dashboard',   icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', active: false },
            { path: '/stats',       label: 'Statistics',  icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z', active: false },
            { path: '/reports',     label: 'Reports',     icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z', active: true },
            { path: '/issues',      label: 'Issues',      icon: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z', active: false },
            { path: '/simulations', label: 'Simulations', icon: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z', active: false },
            { path: '/analytics',   label: '📊 Analytics', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z', active: false },
            { path: '/budget',      label: '💰 Budget',    icon: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z', active: false }
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${
                item.active
                  ? 'text-teal-600 font-bold bg-teal-50 border-l-4 border-teal-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d={item.icon}/>
              </svg>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 min-h-screen pb-8">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Citizen Reports</h1>
                <p className="text-sm text-gray-600 mt-1">View and manage all submitted road safety reports</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchReports} className="px-3 py-1.5 text-sm border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition font-semibold">
                  🔄 Refresh
                </button>
                <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                  {filteredReports.length} Reports
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          {/* Search */}
          <div className="relative mb-5">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by category or description..."
              className="w-full px-4 py-2.5 pl-10 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:outline-none text-sm bg-white shadow-sm"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                  filter === tab.id
                    ? tab.color + ' shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === tab.id ? 'bg-white/30' : 'bg-gray-200'}`}>
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <div className="text-6xl mb-4">
                {filter === 'pending' ? '⏳' : filter === 'in_progress' ? '⚙️' : filter === 'resolved' ? '✅' : '📋'}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {filter === 'all' ? 'No Reports Found' : `No ${filter.replace('_', ' ')} reports`}
              </h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? searchQuery ? 'No reports match your search.' : 'No reports have been submitted yet.'
                  : `There are currently no ${filter.replace('_', ' ')} reports.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map(report => {
                const sevConfig    = getSeverityConfig(report.severity);
                const statusConfig = getStatusConfig(report.status);
                return (
                  <div
                    key={report.report_id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border ${sevConfig.bg}`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-0.5">{report.category}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${statusConfig.bg}`}>
                              {statusConfig.icon} {statusConfig.label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${sevConfig.bg}`}>
                              {sevConfig.label} · {report.severity}/10
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                            Raw status: <em className="ml-1">{report.status}</em>
                          </span>
                        </div>

                        {/* Photo */}
                        {report.photo_url && (
                          <div className="mt-3">
                            <img
                              src={report.photo_url}
                              alt="Report"
                              className="w-28 h-28 object-cover rounded-lg border-2 border-gray-200"
                            />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => navigate('/issues')}
                            className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => navigate('/')}
                            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            View on Map
                          </button>
                          <button
                            onClick={() => navigate('/simulations')}
                            className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors"
                          >
                            🗺️ Simulate Fix
                          </button>
                          <button
                            onClick={() => navigate('/budget')}
                            className="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors"
                          >
                            💰 Budget
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

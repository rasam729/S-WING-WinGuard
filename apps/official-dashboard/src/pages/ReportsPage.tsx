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

export default function ReportsPage() {
  const navigate = useNavigate();
  const { logout, token } = useAuthStore(); // Get token from hook
  
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []); // Remove filter dependency since we're not using it anymore

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Use /all endpoint which doesn't require auth
      const url = 'http://localhost:3000/api/reports/all';
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Reports array:', data.data?.reports);
      console.log('Reports length:', data.data?.reports?.length);
      
      if (data.success && data.data && data.data.reports) {
        console.log('Setting reports:', data.data.reports);
        setReports(data.data.reports);
      } else {
        console.error('Invalid data structure:', data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-100 text-red-700 border-red-300';
    if (severity >= 5) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

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
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span className="font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/stats')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span>Statistics</span>
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-teal-600 font-bold bg-teal-50 border-l-4 border-teal-600 w-full text-left"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <span>Reports</span>
          </button>
          <button 
            onClick={() => navigate('/issues')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span>Issues</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen pb-8">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Citizen Reports</h1>
                <p className="text-sm text-gray-600 mt-1">View and manage all submitted reports</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-700">{reports.length} Reports</span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 w-fit">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                filter === 'all'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                filter === 'pending'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                filter === 'in_progress'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                filter === 'resolved'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600">No reports match the selected filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => (
                <div
                  key={report.report_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Report Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getSeverityColor(report.severity)}`}>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                      </svg>
                    </div>

                    {/* Report Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{report.category}</h3>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                              </svg>
                              {new Date(report.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(report.severity)}`}>
                            Severity: {report.severity}/10
                          </span>
                        </div>
                      </div>

                      {/* Photo Preview */}
                      {report.photo_url && (
                        <div className="mt-3">
                          <img
                            src={report.photo_url}
                            alt="Report"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => navigate(`/issues`)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
                        >
                          View Details
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                          View on Map
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

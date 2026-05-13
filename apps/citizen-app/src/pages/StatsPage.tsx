import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UserStats {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  criticalReports: number;
  upvotesReceived: number;
  impactScore: number;
  routesSaved: number;
  safetyContribution: number;
}

interface RecentActivityItem {
  id: number;
  action: string;
  description: string;
  date: string;
  status: string;
}

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [stats, setStats] = useState<UserStats>({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    criticalReports: 0,
    upvotesReceived: 0,
    impactScore: 0,
    routesSaved: 0,
    safetyContribution: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user's reports
      const response = await fetch('http://localhost:3000/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const reports = data.data.reports;

        // Calculate stats from reports
        const totalReports = reports.length;
        const resolvedReports = reports.filter((r: any) => r.status === 'Resolved').length;
        const pendingReports = reports.filter((r: any) => r.status === 'Report Received').length;
        const criticalReports = reports.filter((r: any) => r.critical_score >= 8).length;
        
        // Calculate impact score (based on reports and severity)
        const impactScore = Math.min(100, totalReports * 10 + resolvedReports * 5);
        const safetyContribution = totalReports > 0 ? Math.min(100, (resolvedReports / totalReports) * 100 + totalReports * 5) : 0;

        setStats({
          totalReports,
          resolvedReports,
          pendingReports,
          criticalReports,
          upvotesReceived: 0, // TODO: Implement upvotes
          impactScore,
          routesSaved: 0, // TODO: Implement saved routes
          safetyContribution: Math.round(safetyContribution)
        });

        // Build recent activity from reports
        const activities: RecentActivityItem[] = reports.slice(0, 4).map((report: any, index: number) => {
          const timeAgo = getTimeAgo(new Date(report.created_at));
          return {
            id: report.report_id,
            action: 'Report Submitted',
            description: `${report.category} - ${report.description.substring(0, 50)}${report.description.length > 50 ? '...' : ''}`,
            date: timeAgo,
            status: report.status === 'Resolved' ? 'resolved' : 'pending'
          };
        });

        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const resolvedPercentage = (stats.resolvedReports / stats.totalReports) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/map')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-gray-700">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black">
                  <span className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent">Your Stats</span>
                </h1>
                <p className="text-sm text-gray-600 font-medium">Track your safety contributions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-full shadow-lg">
              <span className="material-symbols-outlined text-lg">emoji_events</span>
              <span className="font-bold">Level {Math.floor(stats.impactScore / 20)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">Loading your stats...</p>
            </div>
          </div>
        ) : (
          <>
        {/* Impact Score Card */}
        <div className="bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-cyan-100 font-semibold mb-2">Your Impact Score</p>
                <h2 className="text-6xl font-black">{stats.impactScore}</h2>
              </div>
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-cyan-100 text-sm font-semibold mb-1">Reports</p>
                <p className="text-3xl font-black">{stats.totalReports}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-cyan-100 text-sm font-semibold mb-1">Resolved</p>
                <p className="text-3xl font-black">{stats.resolvedReports}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-cyan-100 text-sm font-semibold mb-1">Upvotes</p>
                <p className="text-3xl font-black">{stats.upvotesReceived}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  pending
                </span>
              </div>
              <span className="text-3xl font-black text-gray-900">{stats.pendingReports}</span>
            </div>
            <p className="text-gray-600 font-bold">Pending Reports</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  error
                </span>
              </div>
              <span className="text-3xl font-black text-gray-900">{stats.criticalReports}</span>
            </div>
            <p className="text-gray-600 font-bold">Critical Reports</p>
            <p className="text-xs text-gray-500 mt-1">High priority</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  route
                </span>
              </div>
              <span className="text-3xl font-black text-gray-900">{stats.routesSaved}</span>
            </div>
            <p className="text-gray-600 font-bold">Routes Saved</p>
            <p className="text-xs text-gray-500 mt-1">Safe paths</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <span className="text-3xl font-black text-gray-900">{stats.safetyContribution}%</span>
            </div>
            <p className="text-gray-600 font-bold">Safety Score</p>
            <p className="text-xs text-gray-500 mt-1">Community impact</p>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-600">trending_up</span>
            Report Resolution Progress
          </h3>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Resolved: {stats.resolvedReports}/{stats.totalReports}</span>
              <span className="text-sm font-bold text-cyan-600">{resolvedPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full transition-all duration-500"
                style={{ width: `${resolvedPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-2xl font-black text-green-600">{stats.resolvedReports}</p>
              <p className="text-xs text-gray-600 font-bold mt-1">Resolved</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-2xl font-black text-orange-600">{stats.pendingReports}</p>
              <p className="text-xs text-gray-600 font-bold mt-1">Pending</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-2xl font-black text-red-600">{stats.criticalReports}</p>
              <p className="text-xs text-gray-600 font-bold mt-1">Critical</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-600">history</span>
            Recent Activity
          </h3>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-gray-400 text-4xl">history</span>
              </div>
              <p className="text-gray-600 font-semibold mb-2">No activity yet</p>
              <p className="text-sm text-gray-500">Your recent reports will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-cyan-300 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.status === 'resolved' ? 'bg-green-100' :
                    activity.status === 'pending' ? 'bg-orange-100' :
                    activity.status === 'saved' ? 'bg-cyan-100' :
                    'bg-purple-100'
                  }`}>
                    <span className={`material-symbols-outlined ${
                      activity.status === 'resolved' ? 'text-green-600' :
                      activity.status === 'pending' ? 'text-orange-600' :
                      activity.status === 'saved' ? 'text-cyan-600' :
                      'text-purple-600'
                    }`}>
                      {activity.status === 'resolved' ? 'check_circle' :
                       activity.status === 'pending' ? 'pending' :
                       activity.status === 'saved' ? 'bookmark' :
                       'thumb_up'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-3xl border-t border-gray-200 z-50">
        <div className="flex justify-around items-center px-6 py-4">
          <button
            onClick={() => navigate('/map')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined">map</span>
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
            className="flex flex-col items-center bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-2xl px-5 py-2 shadow-lg"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
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
    </div>
  );
};

export default StatsPage;

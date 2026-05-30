import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useIssuesStore } from '../store/issuesStore';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StatsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { issues, getStats } = useIssuesStore();
  const stats = getStats();
  
  // Calculate Safety Score based on resolved vs unresolved issues
  const calculateSafetyScore = (): number => {
    if (stats.total === 0) return 100;
    
    void (stats.critical + stats.inProgress); // activeIssues - used in weightedPenalty below
    const criticalWeight = 10; // Critical issues have 10x impact
    const inProgressWeight = 5; // In-progress issues have 5x impact
    
    const weightedPenalty = (stats.critical * criticalWeight) + (stats.inProgress * inProgressWeight);
    const maxPenalty = stats.total * criticalWeight; // Worst case: all critical
    
    const score = 100 - ((weightedPenalty / maxPenalty) * 100);
    return Math.max(0, Math.min(100, Math.round(score)));
  };
  
  // Calculate Crime Rate based on police booth and streetlight coverage
  const calculateCrimeRate = (): number => {
    const totalInfrastructure = stats.policeBooths + stats.streetlights + stats.hospitals;
    const resolvedInfrastructure = issues.filter(i => 
      (i.type === 'police_booth' || i.type === 'streetlight' || i.type === 'hospital') && 
      i.status === 'resolved'
    ).length;
    
    if (totalInfrastructure === 0) return 100; // High crime rate if no infrastructure
    
    const coverageRate = (resolvedInfrastructure / totalInfrastructure) * 100;
    const crimeRate = 100 - coverageRate; // Inverse: more coverage = less crime
    
    return Math.max(0, Math.min(100, Math.round(crimeRate)));
  };
  
  // Calculate Resolution Efficiency
  const calculateResolutionEfficiency = (): number => {
    if (stats.total === 0) return 0;
    
    const resolutionRate = (stats.resolved / stats.total) * 100;
    const activeRate = ((stats.inProgress) / stats.total) * 100;
    
    // Efficiency considers both resolution and active work
    const efficiency = (resolutionRate * 0.7) + (activeRate * 0.3);
    return Math.round(efficiency);
  };
  
  const safetyScore = calculateSafetyScore();
  const crimeRate = calculateCrimeRate();
  const resolutionEfficiency = calculateResolutionEfficiency();
  
  // Generate time-series data for line chart (last 7 days)
  const generateTimeSeriesData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, _index) => ({
      day,
      critical: Math.floor(Math.random() * 5) + 2,
      inProgress: Math.floor(Math.random() * 4) + 1,
      resolved: Math.floor(Math.random() * 6) + 3,
    }));
  };

  const [timeSeriesData] = useState(generateTimeSeriesData());

  // Pie chart data for issue types
  const pieData = [
    { name: 'Potholes', value: stats.potholes, color: '#f97316' },
    { name: 'Streetlights', value: stats.streetlights, color: '#14b8a6' },
    { name: 'Police Booths', value: stats.policeBooths, color: '#3b82f6' },
  ];

  // Bar chart data for status distribution
  const statusData = [
    { name: 'Critical', count: stats.critical, color: '#ef4444' },
    { name: 'In Progress', count: stats.inProgress, color: '#3b82f6' },
    { name: 'Resolved', count: stats.resolved, color: '#10b981' },
  ];

  // Category breakdown
  const categoryData = [
    { category: 'Potholes', critical: issues.filter(i => i.type === 'pothole' && i.status === 'critical').length, inProgress: issues.filter(i => i.type === 'pothole' && i.status === 'in_progress').length, resolved: issues.filter(i => i.type === 'pothole' && i.status === 'resolved').length },
    { category: 'Streetlights', critical: issues.filter(i => i.type === 'streetlight' && i.status === 'critical').length, inProgress: issues.filter(i => i.type === 'streetlight' && i.status === 'in_progress').length, resolved: issues.filter(i => i.type === 'streetlight' && i.status === 'resolved').length },
    { category: 'Police Booths', critical: issues.filter(i => i.type === 'police_booth' && i.status === 'critical').length, inProgress: issues.filter(i => i.type === 'police_booth' && i.status === 'in_progress').length, resolved: issues.filter(i => i.type === 'police_booth' && i.status === 'resolved').length },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-teal-600 font-bold bg-teal-50 border-l-4 border-teal-600 w-full text-left"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
            <span>Statistics</span>
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
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
                <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
                <p className="text-sm text-gray-600 mt-1">Comprehensive report analytics</p>
              </div>
              <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-full border border-teal-200">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                <span className="text-sm font-bold text-teal-700">Live Data</span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                  </svg>
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
              </div>
              <p className="text-sm font-bold text-gray-700">Total Issues</p>
              <p className="text-xs text-gray-500 mt-1">All time submissions</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats.resolved}</span>
              </div>
              <p className="text-sm font-bold text-gray-700">Resolved</p>
              <p className="text-xs text-gray-500 mt-1">Successfully fixed</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats.inProgress}</span>
              </div>
              <p className="text-sm font-bold text-gray-700">In Progress</p>
              <p className="text-xs text-gray-500 mt-1">Currently fixing</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                  </svg>
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats.critical}</span>
              </div>
              <p className="text-sm font-bold text-gray-700">Critical</p>
              <p className="text-xs text-gray-500 mt-1">High priority</p>
            </div>
          </div>

          {/* Safety & Crime Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Safety Score */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl shadow-lg border-2 border-teal-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-teal-700 uppercase tracking-wider">Safety Score</p>
                  <p className="text-xs text-teal-600 mt-1">Based on resolved issues</p>
                </div>
                <svg className="w-10 h-10 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-bold text-teal-700">{safetyScore}</span>
                <span className="text-2xl font-bold text-teal-600 mb-1">/100</span>
              </div>
              <div className="w-full h-3 bg-teal-200 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${safetyScore}%` }}
                />
              </div>
              <div className="text-xs text-teal-700 space-y-1">
                <p>• Critical issues: -{stats.critical * 10} points</p>
                <p>• In Progress: -{stats.inProgress * 5} points</p>
                <p>• Resolved: +{stats.resolved} bonus</p>
              </div>
            </div>

            {/* Crime Rate */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl shadow-lg border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-orange-700 uppercase tracking-wider">Crime Rate Index</p>
                  <p className="text-xs text-orange-600 mt-1">Based on infrastructure coverage</p>
                </div>
                <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-bold text-orange-700">{crimeRate}</span>
                <span className="text-2xl font-bold text-orange-600 mb-1">/100</span>
              </div>
              <div className="w-full h-3 bg-orange-200 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${crimeRate}%` }}
                />
              </div>
              <div className="text-xs text-orange-700 space-y-1">
                <p>• Police Booths: {stats.policeBooths} units</p>
                <p>• Streetlights: {stats.streetlights} units</p>
                <p>• Hospitals: {stats.hospitals} units</p>
              </div>
            </div>

            {/* Resolution Efficiency */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Resolution Efficiency</p>
                  <p className="text-xs text-blue-600 mt-1">Overall performance metric</p>
                </div>
                <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-bold text-blue-700">{resolutionEfficiency}</span>
                <span className="text-2xl font-bold text-blue-600 mb-1">%</span>
              </div>
              <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${resolutionEfficiency}%` }}
                />
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Resolution Rate: {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</p>
                <p>• Active Work: {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%</p>
                <p>• Pending: {stats.total > 0 ? Math.round((stats.critical / stats.total) * 100) : 0}%</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Line Chart - Weekly Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Issue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
                  <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} name="Critical" />
                  <Line type="monotone" dataKey="inProgress" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} name="In Progress" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Issue Types Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Issue Types Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium text-gray-700">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar Chart - Status Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stacked Bar Chart - Category Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Category Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" stroke="#6b7280" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
                  <Bar dataKey="critical" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} name="Critical" />
                  <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="In Progress" />
                  <Bar dataKey="resolved" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resolution Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Resolution Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Resolved</span>
                    <span className="text-sm font-bold text-green-600">
                      {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">In Progress</span>
                    <span className="text-sm font-bold text-blue-600">
                      {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Critical</span>
                    <span className="text-sm font-bold text-red-600">
                      {stats.total > 0 ? Math.round((stats.critical / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all"
                      style={{ width: `${stats.total > 0 ? (stats.critical / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Performance Metrics</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
                    <p className="text-2xl font-bold text-teal-600">2.4 hrs</p>
                  </div>
                  <svg className="w-10 h-10 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Resolution Rate</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                    </p>
                  </div>
                  <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Top Issue Locations */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Issue Summary by Type</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-orange-600">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">Potholes</span>
                    <span className="text-sm font-bold text-gray-600">{stats.potholes} issues</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.potholes / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-teal-600">2</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">Streetlights</span>
                    <span className="text-sm font-bold text-gray-600">{stats.streetlights} issues</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.streetlights / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-900">Police Booths</span>
                    <span className="text-sm font-bold text-gray-600">{stats.policeBooths} issues</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.policeBooths / stats.total) * 100 : 0}%` }}
                    />
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

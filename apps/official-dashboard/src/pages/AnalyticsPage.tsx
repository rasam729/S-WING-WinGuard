import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  avgResolutionTime: number;
  reportsByCategory: { [key: string]: number };
  reportsBySeverity: { [key: string]: number };
  reportsByRoadType: { [key: string]: number };
  reportsByWard: { [key: string]: number };
  timeSeriesData: { date: string; count: number }[];
  resolutionTimeByCategory: { [key: string]: number };
  costByCategory: { [key: string]: number };
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/analytics?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300">No analytics data available</p>
      </div>
    );
  }

  // Chart data configurations
  const categoryChartData = {
    labels: Object.keys(analytics.reportsByCategory),
    datasets: [{
      label: 'Reports by Category',
      data: Object.values(analytics.reportsByCategory),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 2
    }]
  };

  const severityChartData = {
    labels: Object.keys(analytics.reportsBySeverity),
    datasets: [{
      label: 'Reports by Severity',
      data: Object.values(analytics.reportsBySeverity),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(34, 197, 94, 0.8)',
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(34, 197, 94, 1)',
      ],
      borderWidth: 2
    }]
  };

  const roadTypeChartData = {
    labels: Object.keys(analytics.reportsByRoadType),
    datasets: [{
      label: 'Reports by Road Type',
      data: Object.values(analytics.reportsByRoadType),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2
    }]
  };

  const timeSeriesChartData = {
    labels: analytics.timeSeriesData.map(d => d.date),
    datasets: [{
      label: 'Reports Over Time',
      data: analytics.timeSeriesData.map(d => d.count),
      fill: true,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      tension: 0.4
    }]
  };

  const resolutionTimeChartData = {
    labels: Object.keys(analytics.resolutionTimeByCategory),
    datasets: [{
      label: 'Avg Resolution Time (hours)',
      data: Object.values(analytics.resolutionTimeByCategory),
      backgroundColor: 'rgba(168, 85, 247, 0.8)',
      borderColor: 'rgba(168, 85, 247, 1)',
      borderWidth: 2
    }]
  };

  const costChartData = {
    labels: Object.keys(analytics.costByCategory),
    datasets: [{
      label: 'Cost by Category (₹)',
      data: Object.values(analytics.costByCategory),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2
    }]
  };

  const resolutionRate = analytics.totalReports > 0 
    ? ((analytics.resolvedReports / analytics.totalReports) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">📊 Analytics Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Reports</p>
                <p className="text-3xl font-bold text-white mt-2">{analytics.totalReports}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Resolved</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{analytics.resolvedReports}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">{analytics.pendingReports}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Resolution Rate</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">{resolutionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Series Chart */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Reports Trend</h3>
            <Line data={timeSeriesChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          {/* Category Distribution */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Category Distribution</h3>
            <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          {/* Severity Distribution */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Severity Levels</h3>
            <Pie data={severityChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          {/* Road Type Analysis */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Road Type Analysis</h3>
            <Bar data={roadTypeChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          {/* Resolution Time by Category */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Avg Resolution Time</h3>
            <Bar data={resolutionTimeChartData} options={{ responsive: true, maintainAspectRatio: true, indexAxis: 'y' }} />
          </div>

          {/* Cost Analysis */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Cost by Category</h3>
            <Bar data={costChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>

        {/* Ward-wise Analysis */}
        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Ward-wise Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(analytics.reportsByWard).map(([ward, count]) => (
              <div key={ward} className="bg-gray-700 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">{ward}</p>
                <p className="text-2xl font-bold text-white mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface MaintenanceSchedule {
  schedule_id: string;
  asset_type: string;
  asset_id: string;
  address: string;
  ward: string;
  frequency: string;
  last_maintenance: string;
  next_maintenance: string;
  type: string;
  status: string;
  estimated_cost: number;
  assigned_to: string;
}

interface RepairHistory {
  repair_id: string;
  asset_id: string;
  issue_type: string;
  severity: number;
  reported_date: string;
  repair_start_date: string;
  repair_end_date: string;
  contractor_name: string;
  estimated_cost: number;
  actual_cost: number;
  status: string;
  quality_rating: number;
}

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [repairs, setRepairs] = useState<RepairHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedules' | 'repairs' | 'upcoming' | 'overdue'>('schedules');

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch schedules
      const schedulesRes = await fetch('http://localhost:3000/api/maintenance/schedules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const schedulesData = await schedulesRes.json();
      if (schedulesData.success) {
        setSchedules(schedulesData.data || []);
      }

      // Fetch repair history
      const repairsRes = await fetch('http://localhost:3000/api/repairs/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const repairsData = await repairsRes.json();
      if (repairsData.success) {
        setRepairs(repairsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
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
          <p className="text-gray-300 font-medium">Loading Maintenance Data...</p>
        </div>
      </div>
    );
  }

  const upcomingSchedules = schedules.filter(s => {
    const nextDate = new Date(s.next_maintenance);
    const today = new Date();
    const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  });

  const overdueSchedules = schedules.filter(s => {
    const nextDate = new Date(s.next_maintenance);
    const today = new Date();
    return nextDate < today && s.status === 'scheduled';
  });

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">🔧 Maintenance & Repairs</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ← Back
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

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['schedules', 'repairs', 'upcoming', 'overdue'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'upcoming' && upcomingSchedules.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                    {upcomingSchedules.length}
                  </span>
                )}
                {tab === 'overdue' && overdueSchedules.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    {overdueSchedules.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Total Schedules</p>
            <p className="text-3xl font-bold text-white mt-2">{schedules.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Upcoming (30 days)</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{upcomingSchedules.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Overdue</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{overdueSchedules.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Completed Repairs</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {repairs.filter(r => r.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'schedules' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">All Maintenance Schedules</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset Type</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Location</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Frequency</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Maintenance</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Next Maintenance</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.schedule_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-white capitalize">{schedule.asset_type}</td>
                      <td className="py-3 px-4 text-gray-300">{schedule.address}</td>
                      <td className="py-3 px-4 text-gray-300 capitalize">{schedule.frequency}</td>
                      <td className="py-3 px-4 text-gray-300">
                        {schedule.last_maintenance ? new Date(schedule.last_maintenance).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(schedule.next_maintenance).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          schedule.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          schedule.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          schedule.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ₹{(schedule.estimated_cost / 1000).toFixed(1)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'repairs' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Repair History</h3>
            <div className="space-y-4">
              {repairs.map((repair) => (
                <div key={repair.repair_id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{repair.issue_type}</h4>
                      <p className="text-sm text-gray-400">Asset ID: {repair.asset_id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      repair.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      repair.status === 'under_warranty' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {repair.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Contractor:</span>
                      <p className="text-white">{repair.contractor_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Reported:</span>
                      <p className="text-white">{new Date(repair.reported_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Estimated Cost:</span>
                      <p className="text-white">₹{(repair.estimated_cost / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Actual Cost:</span>
                      <p className="text-white">
                        {repair.actual_cost ? `₹${(repair.actual_cost / 1000).toFixed(1)}K` : 'Pending'}
                      </p>
                    </div>
                  </div>
                  {repair.quality_rating && (
                    <div className="mt-3 flex items-center">
                      <span className="text-gray-400 text-sm mr-2">Quality Rating:</span>
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">⭐</span>
                        <span className="text-white font-medium">{repair.quality_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Upcoming Maintenance (Next 30 Days)</h3>
            <div className="space-y-4">
              {upcomingSchedules.map((schedule) => {
                const nextDate = new Date(schedule.next_maintenance);
                const today = new Date();
                const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={schedule.schedule_id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-white capitalize">{schedule.asset_type}</h4>
                        <p className="text-sm text-gray-400">{schedule.address}</p>
                        <p className="text-sm text-gray-400 mt-1">Ward: {schedule.ward}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          daysUntil <= 7 ? 'text-red-400' :
                          daysUntil <= 14 ? 'text-yellow-400' :
                          'text-blue-400'
                        }`}>
                          {daysUntil} days
                        </p>
                        <p className="text-sm text-gray-400">until maintenance</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <p className="text-white capitalize">{schedule.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Frequency:</span>
                        <p className="text-white capitalize">{schedule.frequency}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Est. Cost:</span>
                        <p className="text-white">₹{(schedule.estimated_cost / 1000).toFixed(1)}K</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingSchedules.length === 0 && (
                <p className="text-center text-gray-400 py-8">No upcoming maintenance in the next 30 days</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overdue' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">⚠️ Overdue Maintenance</h3>
            <div className="space-y-4">
              {overdueSchedules.map((schedule) => {
                const nextDate = new Date(schedule.next_maintenance);
                const today = new Date();
                const daysOverdue = Math.ceil((today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={schedule.schedule_id} className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-white capitalize">{schedule.asset_type}</h4>
                        <p className="text-sm text-gray-400">{schedule.address}</p>
                        <p className="text-sm text-gray-400 mt-1">Ward: {schedule.ward}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-400">{daysOverdue} days</p>
                        <p className="text-sm text-red-400">overdue</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <p className="text-white capitalize">{schedule.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Due Date:</span>
                        <p className="text-white">{new Date(schedule.next_maintenance).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Est. Cost:</span>
                        <p className="text-white">₹{(schedule.estimated_cost / 1000).toFixed(1)}K</p>
                      </div>
                    </div>
                    <button className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                      Schedule Immediately
                    </button>
                  </div>
                );
              })}
              {overdueSchedules.length === 0 && (
                <p className="text-center text-gray-400 py-8">✅ No overdue maintenance</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

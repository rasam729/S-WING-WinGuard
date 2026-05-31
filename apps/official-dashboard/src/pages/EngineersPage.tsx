import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Engineer {
  engineer_id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  jurisdiction_type: string;
  wards: string[];
  categories: string[];
  max_concurrent_issues: number;
  current_load: number;
  availability: string;
  avg_resolution_time: number;
  resolution_rate: number;
  rating: number;
}

interface Assignment {
  assignment_id: string;
  issue_id: number;
  engineer_id: string;
  assigned_at: string;
  status: string;
  accepted_at: string;
  completed_at: string;
}

export default function EngineersPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const fetchEngineers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/api/engineers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEngineers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching engineers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineerDetails = async (engineerId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3000/api/engineers/${engineerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedEngineer(data.data);
        setAssignments(data.data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching engineer details:', error);
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
          <p className="text-gray-300 font-medium">Loading Engineers...</p>
        </div>
      </div>
    );
  }

  const availableEngineers = engineers.filter(e => e.availability === 'available');
  void engineers.filter(e => e.availability === 'busy'); // busyEngineers: reserved for future display
  const totalLoad = engineers.reduce((sum, e) => sum + e.current_load, 0);
  const avgResolutionRate = engineers.length > 0
    ? (engineers.reduce((sum, e) => sum + e.resolution_rate, 0) / engineers.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">👷 Executive Engineers</h1>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Total Engineers</p>
            <p className="text-3xl font-bold text-white mt-2">{engineers.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Available</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{availableEngineers.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Total Active Issues</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{totalLoad}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Avg Resolution Rate</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">{avgResolutionRate}%</p>
          </div>
        </div>

        {/* Engineers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {engineers.map((engineer) => {
            const utilizationRate = engineer.max_concurrent_issues > 0
              ? ((engineer.current_load / engineer.max_concurrent_issues) * 100).toFixed(0)
              : 0;

            return (
              <div
                key={engineer.engineer_id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition cursor-pointer"
                onClick={() => fetchEngineerDetails(engineer.engineer_id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{engineer.name}</h3>
                    <p className="text-sm text-gray-400">{engineer.designation}</p>
                    <p className="text-sm text-gray-400">{engineer.department}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    engineer.availability === 'available' ? 'bg-green-500/20 text-green-400' :
                    engineer.availability === 'busy' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {engineer.availability}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 w-32">Email:</span>
                    <span className="text-white">{engineer.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 w-32">Phone:</span>
                    <span className="text-white">{engineer.phone}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 w-32">Jurisdiction:</span>
                    <span className="text-white capitalize">{engineer.jurisdiction_type}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-400 w-32">Rating:</span>
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">⭐</span>
                      <span className="text-white font-medium">{engineer.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Workload Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Workload</span>
                    <span className="text-white">{engineer.current_load} / {engineer.max_concurrent_issues}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        Number(utilizationRate) >= 90 ? 'bg-red-500' :
                        Number(utilizationRate) >= 70 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${utilizationRate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{utilizationRate}% utilized</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs">Resolution Rate</p>
                    <p className="text-xl font-bold text-green-400">{engineer.resolution_rate.toFixed(0)}%</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs">Avg Time (hrs)</p>
                    <p className="text-xl font-bold text-blue-400">{engineer.avg_resolution_time}</p>
                  </div>
                </div>

                {/* Jurisdiction Tags */}
                {engineer.wards && engineer.wards.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-400 text-xs mb-2">Wards:</p>
                    <div className="flex flex-wrap gap-2">
                      {engineer.wards.slice(0, 4).map((ward, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {ward}
                        </span>
                      ))}
                      {engineer.wards.length > 4 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                          +{engineer.wards.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Engineer Details Modal */}
        {selectedEngineer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{selectedEngineer.name}</h2>
                <button
                  onClick={() => setSelectedEngineer(null)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-gray-400 text-sm">Designation</p>
                    <p className="text-white font-medium">{selectedEngineer.designation}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Department</p>
                    <p className="text-white font-medium">{selectedEngineer.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white font-medium">{selectedEngineer.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Phone</p>
                    <p className="text-white font-medium">{selectedEngineer.phone}</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4">Recent Assignments</h3>
                <div className="space-y-3">
                  {assignments.slice(0, 10).map((assignment) => (
                    <div key={assignment.assignment_id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium">Issue #{assignment.issue_id}</p>
                          <p className="text-sm text-gray-400">
                            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          assignment.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          assignment.status === 'escalated' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {assignments.length === 0 && (
                    <p className="text-center text-gray-400 py-4">No assignments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

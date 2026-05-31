import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Contractor {
  contractor_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  specialization: string[];
  rating: number;
  completed_projects: number;
  ongoing_projects: number;
  status: string;
  assigned_issue?: string;
  route_info?: string;
  last_relay_date?: string;
  fix_timeline?: string;
}

export default function ContractorsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dynamicAssignments, setDynamicAssignments] = useState<Record<string, any>>({});

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? 'http://localhost:3000/api/contractors'
        : `http://localhost:3000/api/contractors?status=${filter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContractors(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching contractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsForAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const assignments: Record<string, any> = {};
        if (data.data) {
          data.data.forEach((r: any) => {
            if (r.contractor_id || String(r.contractor_id) !== 'undefined') {
              // Note: Contractor IDs might be stored differently depending on the schema, try to match it
              const cId = String(r.contractor_id);
              if (cId && cId !== 'undefined' && cId !== 'null') {
                assignments[cId] = {
                  assigned_issue: `${r.category} at ${r.address || 'Unknown Location'}`,
                  route_info: `Sanctioned: ₹${r.amount_sanctioned || 0}`,
                  last_relay_date: new Date(r.created_at).toISOString().split('T')[0],
                  fix_timeline: r.status
                };
              }
            }
          });
        }
        setDynamicAssignments(assignments);
      }
    } catch (e) {
      console.warn('Failed to fetch reports for assignments', e);
    }
  };

  useEffect(() => {
    fetchContractors();
    fetchReportsForAssignments();
  }, [filter]);

  const sampleAssignments: Record<string, { assigned_issue: string; route_info: string; last_relay_date: string; fix_timeline: string }> = {
    'CTR-001': { assigned_issue: 'Highway pothole cluster on I-95 Exit 42', route_info: 'Route: I-95 North', last_relay_date: '2026-05-10', fix_timeline: '2 weeks' },
    'CTR-002': { assigned_issue: 'Streetlight outage at Shibuya Crossing', route_info: 'Route: Shibuya-Ku road grid', last_relay_date: '2026-05-08', fix_timeline: '5 days' },
    'CTR-003': { assigned_issue: 'Drainage cleanup at Orchard Road', route_info: 'Route: Orchard Road drainage corridor', last_relay_date: '2026-05-12', fix_timeline: '72 hours' }
  };

  const augmentedContractors = contractors.map((contractor) => ({
    ...contractor,
    ...(sampleAssignments[contractor.contractor_id] || {}),
    ...(dynamicAssignments[String(contractor.contractor_id)] || {})
  }));

  const filteredContractors = augmentedContractors.filter(contractor =>
    contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.assigned_issue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.route_info?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Loading Contractors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">🏗️ Contractors Management</h1>
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
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search contractors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Contractors</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Total Contractors</p>
            <p className="text-3xl font-bold text-white mt-2">{contractors.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Active</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {contractors.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Ongoing Projects</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {contractors.reduce((sum, c) => sum + c.ongoing_projects, 0)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm font-medium">Completed Projects</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {contractors.reduce((sum, c) => sum + c.completed_projects, 0)}
            </p>
          </div>
        </div>

        {/* Contractors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContractors.map((contractor) => (
            <div key={contractor.contractor_id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{contractor.company_name}</h3>
                  <p className="text-sm text-gray-400">{contractor.contact_person}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  contractor.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  contractor.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {contractor.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="text-gray-400 w-24">Email:</span>
                  <span className="text-white">{contractor.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-400 w-24">Phone:</span>
                  <span className="text-white">{contractor.phone}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-400 w-24">Rating:</span>
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">⭐</span>
                    <span className="text-white font-medium">{contractor.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs">Ongoing</p>
                  <p className="text-xl font-bold text-blue-400">{contractor.ongoing_projects}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs">Completed</p>
                  <p className="text-xl font-bold text-green-400">{contractor.completed_projects}</p>
                </div>
              </div>

              {(contractor.assigned_issue || contractor.route_info || contractor.last_relay_date || contractor.fix_timeline) && (
                <div className="bg-gray-700 rounded-xl p-4 mb-4 space-y-2 border border-gray-600">
                  {contractor.assigned_issue && (
                    <div className="text-sm">
                      <p className="text-gray-400">Assigned Issue</p>
                      <p className="text-white font-medium">{contractor.assigned_issue}</p>
                    </div>
                  )}
                  {contractor.route_info && (
                    <div className="text-sm">
                      <p className="text-gray-400">Assigned Route</p>
                      <p className="text-white font-medium">{contractor.route_info}</p>
                    </div>
                  )}
                  {contractor.last_relay_date && (
                    <div className="text-sm">
                      <p className="text-gray-400">Last Relay Date</p>
                      <p className="text-white font-medium">{contractor.last_relay_date}</p>
                    </div>
                  )}
                  {contractor.fix_timeline && (
                    <div className="text-sm">
                      <p className="text-gray-400">Fix Timeline</p>
                      <p className="text-white font-medium">{contractor.fix_timeline}</p>
                    </div>
                  )}
                </div>
              )}

              {contractor.specialization && contractor.specialization.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 text-xs mb-2">Specializations:</p>
                  <div className="flex flex-wrap gap-2">
                    {contractor.specialization.slice(0, 3).map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate(`/contractors/${contractor.contractor_id}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View Details
              </button>
            </div>
          ))}
        </div>

        {filteredContractors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No contractors found</p>
          </div>
        )}
      </main>
    </div>
  );
}

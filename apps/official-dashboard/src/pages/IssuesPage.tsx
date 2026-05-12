import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useIssuesStore } from '../store/issuesStore';

export default function IssuesPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { issues, updateIssueStatus } = useIssuesStore();
  
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleToggleResolved = async (issueId: number, currentStatus: 'critical' | 'in_progress' | 'resolved') => {
    setUpdatingId(issueId);
    try {
      const newStatus = currentStatus === 'resolved' ? 'critical' : 'resolved';
      
      updateIssueStatus(issueId, newStatus);

      // Send notification to citizen app
      if (newStatus === 'resolved') {
        const issue = issues.find(i => i.id === issueId);
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 1,
            message: `Your report about ${issue?.type} has been resolved!`,
            type: 'success'
          })
        });
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (issueId: number, newStatus: 'critical' | 'in_progress' | 'resolved') => {
    setUpdatingId(issueId);
    try {
      updateIssueStatus(issueId, newStatus);

      // Send notification
      const issue = issues.find(i => i.id === issueId);
      if (issue) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: 1,
            message: `Your report about ${issue.type} status updated to: ${newStatus}`,
            type: 'info'
          })
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'text-red-600 bg-red-100';
    if (severity >= 5) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusColor = (status: string) => {
    if (status === 'resolved') return 'bg-green-100 text-green-700 border border-green-300';
    if (status === 'in_progress') return 'bg-blue-100 text-blue-700 border border-blue-300';
    return 'bg-red-100 text-red-700 border border-red-300';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'resolved') return 'Resolved';
    if (status === 'in_progress') return 'In Progress';
    return 'Critical';
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <span>Reports</span>
          </button>
          <button 
            onClick={() => navigate('/issues')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-teal-600 font-bold bg-teal-50 border-l-4 border-teal-600 w-full text-left"
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
                <h1 className="text-2xl font-bold text-gray-900">Road Issues Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and resolve reported issues</p>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-200">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
                <span className="text-sm font-bold text-orange-700">
                  {issues.filter(i => i.status !== 'resolved').length} Active Issues
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          {issues.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Issues Found</h3>
              <p className="text-gray-600">All issues have been resolved!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all ${
                    issue.status === 'resolved' 
                      ? 'border-green-200 bg-green-50/30' 
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    {/* Issue Icon & Severity */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getSeverityColor(issue.severity)}`}>
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}/10
                      </span>
                    </div>

                    {/* Issue Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 capitalize">{issue.type.replace('_', ' ')}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(issue.status)}`}>
                              {getStatusLabel(issue.status)}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3 leading-relaxed">{issue.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              <span className="font-medium">{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                              </svg>
                              <span className="font-medium">Reported {issue.reportedAt}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Toggle Resolved Button */}
                        <button
                          onClick={() => handleToggleResolved(issue.id, issue.status)}
                          disabled={updatingId === issue.id}
                          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                            issue.status === 'resolved'
                              ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
                              : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updatingId === issue.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                {issue.status === 'resolved' ? (
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                ) : (
                                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                                )}
                              </svg>
                              <span>{issue.status === 'resolved' ? 'Mark as Unresolved' : 'Mark as Resolved'}</span>
                            </>
                          )}
                        </button>

                        {/* Status Update Dropdown */}
                        {issue.status !== 'resolved' && (
                          <select
                            value={issue.status}
                            onChange={(e) => handleUpdateStatus(issue.id, e.target.value as 'critical' | 'in_progress' | 'resolved')}
                            disabled={updatingId === issue.id}
                            className="px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:opacity-50"
                          >
                            <option value="critical">Critical</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        )}

                        {/* View on Map */}
                        <button 
                          onClick={() => navigate('/')}
                          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface Alert {
  notification_id: number;
  user_id: number;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  sent_at: string;
  read_at: string | null;
  report_id?: number;
  category?: string;
  report_status?: string;
}

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch notifications from API
  useEffect(() => {
    fetchNotifications();
    
    // Connect to Socket.io for real-time notification updates
    const socket = io('http://localhost:3000');
    
    socket.on('new-notification', (data: any) => {
      console.log('📬 New notification received in AlertsPage:', data);
      fetchNotifications(); // Refresh notifications
    });
    
    socket.on('report-resolved', (data: any) => {
      console.log('🎉 Report resolved notification in AlertsPage:', data);
      fetchNotifications(); // Refresh to show resolution notification
    });
    
    socket.on('report-status-changed', (data: any) => {
      console.log('📊 Report status changed in AlertsPage:', data);
      fetchNotifications(); // Refresh to get new status update notifications
    });
    
    // Refresh every 10 seconds for testing (change to 30 seconds in production)
    const interval = setInterval(fetchNotifications, 10000);
    
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [token]);

  const fetchNotifications = async () => {
    try {
      console.log('🔄 Fetching notifications for user:', user?.userId);
      
      // Fetch user's reports first to get their report IDs
      const reportsResponse = await fetch('http://localhost:3000/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!reportsResponse.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const reportsData = await reportsResponse.json();
      const userReportIds = reportsData.data.reports.map((r: any) => r.report_id);
      
      console.log('📋 User report IDs:', userReportIds);
      
      // Fetch all notifications
      const notificationsResponse = await fetch('http://localhost:3000/api/notifications');
      const notificationsData = await notificationsResponse.json();
      
      if (notificationsData.success) {
        // Filter notifications to only show those related to user's reports
        const userNotifications = notificationsData.data.filter((notif: Alert) => 
          notif.user_id === user?.userId || 
          (notif.report_id && userReportIds.includes(notif.report_id))
        );
        
        console.log('✅ Filtered notifications:', userNotifications.length);
        setAlerts(userNotifications);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
        method: 'PUT'
      });
      setAlerts(alerts.map(alert => 
        alert.notification_id === id ? { ...alert, read_at: new Date().toISOString() } : alert
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadAlerts = alerts.filter(a => !a.read_at);
      await Promise.all(
        unreadAlerts.map(alert =>
          fetch(`http://localhost:3000/api/notifications/${alert.notification_id}/read`, {
            method: 'PUT'
          })
        )
      );
      setAlerts(alerts.map(alert => ({ ...alert, read_at: new Date().toISOString() })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteAlert = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/notifications/${id}`, {
        method: 'DELETE'
      });
      setAlerts(alerts.filter(alert => alert.notification_id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(a => !a.read_at) 
    : alerts;

  const unreadCount = alerts.filter(a => !a.read_at).length;

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getAlertTitle = (_message: string, type: string) => {
    if (type === 'success') return 'Issue Resolved';
    if (type === 'info') return 'Status Update';
    if (type === 'warning') return 'Safety Alert';
    if (type === 'danger') return 'Critical Alert';
    return 'Notification';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      default:
        return 'info';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'from-green-500 to-emerald-600';
      case 'warning':
        return 'from-orange-500 to-amber-600';
      case 'danger':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-cyan-500 to-teal-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50">
      {/* Header */}
      <header className="pro-header bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mobile-px-3 mobile-py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 mobile-gap-2 min-w-0">
              <button
                onClick={() => navigate('/map')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                aria-label="Back to Map"
              >
                <span className="material-symbols-outlined text-gray-700">arrow_back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-3xl font-black font-display mobile-text-xl mobile-text-wrap">
                  <span className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent">Alerts</span>
                </h1>
                <p className="text-sm text-gray-600 font-medium mobile-text-xs truncate">Stay updated on your reports</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-full shadow-lg mobile-px-3 mobile-py-1 flex-shrink-0">
                <span className="material-symbols-outlined text-lg mobile-hidden">notifications_active</span>
                <span className="font-bold mobile-text-xs">{unreadCount} New</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mobile-px-3 mobile-py-4">
        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6 mobile-stack mobile-gap-2">
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-md border border-gray-200 mobile-full-width">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all mobile-px-4 mobile-py-2 mobile-text-xs flex-1 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 mobile-px-4 mobile-py-2 mobile-text-xs flex-1 justify-center ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-black">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-bold hover:underline flex items-center gap-1 mobile-text-xs mobile-full-width mobile-justify-center mobile-py-2"
            >
              <span className="material-symbols-outlined text-lg">done_all</span>
              Mark all as read
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="space-y-4 mobile-space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center border-2 border-gray-200 mobile-rounded mobile-compact mobile-p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 mobile-w-16 mobile-h-16">
                <span className="material-symbols-outlined text-cyan-600 text-5xl mobile-text-3xl">notifications_off</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2 font-display mobile-text-xl">No Alerts</h3>
              <p className="text-gray-600 mobile-text-sm">You're all caught up! No new alerts at the moment.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.notification_id}
                className={`alert-card bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all hover:shadow-xl mobile-rounded ${
                  alert.read_at ? 'opacity-75' : ''
                }`}
              >
                <div className="flex">
                  {/* Color Bar */}
                  <div className={`w-2 bg-gradient-to-b ${getAlertColor(alert.type)} flex-shrink-0`} />
                  
                  {/* Content */}
                  <div className="flex-1 p-6 mobile-compact">
                    <div className="flex items-start gap-4 mobile-gap-2 mobile-stack">
                      {/* Icon */}
                      <div className={`alert-icon w-12 h-12 rounded-xl bg-gradient-to-br ${getAlertColor(alert.type)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <span className="material-symbols-outlined text-white text-2xl mobile-text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {getAlertIcon(alert.type)}
                        </span>
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2 mobile-gap-2">
                          <h3 className="text-xl font-bold text-gray-900 font-display mobile-text-base mobile-text-wrap">{getAlertTitle(alert.message, alert.type)}</h3>
                          {!alert.read_at && (
                            <span className="w-3 h-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="text-gray-700 mb-3 leading-relaxed mobile-text-sm mobile-text-wrap">{alert.message}</p>

                        <div className="flex items-center justify-between mobile-stack mobile-gap-2">
                          <span className="text-sm text-gray-500 font-medium flex items-center gap-1 mobile-text-xs">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {getRelativeTime(alert.sent_at)}
                          </span>

                          <div className="flex items-center gap-2 mobile-full-width mobile-justify-between">
                            {!alert.read_at && (
                              <button
                                onClick={() => markAsRead(alert.notification_id)}
                                className="px-4 py-2 bg-cyan-50 text-cyan-600 rounded-xl font-bold text-sm hover:bg-cyan-100 transition-colors flex items-center gap-1 mobile-px-3 mobile-py-1 mobile-text-xs mobile-flex-1"
                              >
                                <span className="material-symbols-outlined text-sm">done</span>
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteAlert(alert.notification_id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              aria-label="Delete Alert"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-3xl border-t border-gray-200 z-50">
        <div className="flex justify-around items-center px-6 py-4 mobile-px-3 mobile-py-2">
          <button
            onClick={() => navigate('/map')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all mobile-px-3 mobile-py-1 mobile-rounded"
            aria-label="Map"
          >
            <span className="material-symbols-outlined">map</span>
            <span className="text-xs font-bold mt-1">Map</span>
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="flex flex-col items-center bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-2xl px-5 py-2 shadow-lg relative mobile-px-3 mobile-py-1 mobile-rounded"
            aria-label="Alerts"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
            <span className="text-xs font-bold mt-1">Alerts</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/stats')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all mobile-px-3 mobile-py-1 mobile-rounded"
            aria-label="Stats"
          >
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-xs font-bold mt-1">Stats</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all mobile-px-3 mobile-py-1 mobile-rounded"
            aria-label="Profile"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-xs font-bold mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AlertsPage;

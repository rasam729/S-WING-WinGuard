import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  timestamp: string;
  read: boolean;
  location?: string;
}

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      title: 'Report Status Updated',
      message: 'Your report about pothole on MG Road has been marked as "In Progress"',
      type: 'info',
      timestamp: '2 hours ago',
      read: false,
      location: 'MG Road, Bengaluru'
    },
    {
      id: 2,
      title: 'Issue Resolved',
      message: 'The streetlight issue you reported on 5th Cross has been fixed!',
      type: 'success',
      timestamp: '1 day ago',
      read: false,
      location: '5th Cross, Indiranagar'
    },
    {
      id: 3,
      title: 'Safety Alert',
      message: 'High crime activity reported near your saved route. Consider alternative path.',
      type: 'warning',
      timestamp: '2 days ago',
      read: true,
      location: 'Koramangala'
    },
    {
      id: 4,
      title: 'Critical Alert',
      message: 'Road closure on Outer Ring Road due to emergency repairs. Avoid this route.',
      type: 'danger',
      timestamp: '3 days ago',
      read: true,
      location: 'Outer Ring Road'
    },
    {
      id: 5,
      title: 'New Feature',
      message: 'AI-powered route suggestions now available! Check out the route planner.',
      type: 'info',
      timestamp: '5 days ago',
      read: true
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const markAsRead = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })));
  };

  const deleteAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(a => !a.read) 
    : alerts;

  const unreadCount = alerts.filter(a => !a.read).length;

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
                <h1 className="text-3xl font-black font-display">
                  <span className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent">Alerts</span>
                </h1>
                <p className="text-sm text-gray-600 font-medium">Stay updated on your reports</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-full shadow-lg">
                <span className="material-symbols-outlined text-lg">notifications_active</span>
                <span className="font-bold">{unreadCount} New</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-md border border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
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
              className="text-sm text-cyan-600 hover:text-cyan-700 font-bold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">done_all</span>
              Mark all as read
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center border-2 border-gray-200">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-cyan-600 text-5xl">notifications_off</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2 font-display">No Alerts</h3>
              <p className="text-gray-600">You're all caught up! No new alerts at the moment.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all hover:shadow-xl ${
                  alert.read ? 'opacity-75' : ''
                }`}
              >
                <div className="flex">
                  {/* Color Bar */}
                  <div className={`w-2 bg-gradient-to-b ${getAlertColor(alert.type)}`} />
                  
                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAlertColor(alert.type)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {getAlertIcon(alert.type)}
                        </span>
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 font-display">{alert.title}</h3>
                          {!alert.read && (
                            <span className="w-3 h-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="text-gray-700 mb-3 leading-relaxed">{alert.message}</p>
                        
                        {alert.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                            <span className="font-medium">{alert.location}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {alert.timestamp}
                          </span>

                          <div className="flex items-center gap-2">
                            {!alert.read && (
                              <button
                                onClick={() => markAsRead(alert.id)}
                                className="px-4 py-2 bg-cyan-50 text-cyan-600 rounded-xl font-bold text-sm hover:bg-cyan-100 transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">done</span>
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
            className="flex flex-col items-center bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-2xl px-5 py-2 shadow-lg relative"
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
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all"
          >
            <span className="material-symbols-outlined">analytics</span>
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

export default AlertsPage;

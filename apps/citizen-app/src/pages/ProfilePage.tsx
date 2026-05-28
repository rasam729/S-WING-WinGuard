import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: 'Bengaluru, Karnataka'
  });

  const handleSave = () => {
    // TODO: API call to update profile
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-24">
      {/* Header */}
      <header className="pro-header bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200">
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
                  <span className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent">Profile</span>
                </h1>
                <p className="text-sm text-gray-600 font-medium mobile-text-xs truncate">Manage your account</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mobile-px-3 mobile-py-1 mobile-text-xs flex-shrink-0"
            >
              <span className="material-symbols-outlined text-lg mobile-text-base">
                {isEditing ? 'close' : 'edit'}
              </span>
              <span className="mobile-hidden">{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mobile-px-3 mobile-py-4">
        {/* Profile Card */}
        <div className="profile-header bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden mobile-rounded mobile-compact">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10 flex items-center gap-6 mobile-gap-3 mobile-stack">
            <div className="profile-avatar w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-black border-4 border-white/30 flex-shrink-0">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 mobile-text-center">
              <h2 className="profile-name text-4xl font-black mb-2 font-display mobile-text-2xl mobile-text-wrap">{user?.fullName || 'User'}</h2>
              <p className="text-cyan-100 font-semibold mb-1 mobile-text-sm truncate">{user?.email}</p>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full w-fit mobile-mx-auto">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span className="text-sm font-bold">Verified Guardian</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200 mobile-rounded mobile-compact">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 font-display mobile-text-xl mobile-text-wrap">
            <span className="material-symbols-outlined text-cyan-600 flex-shrink-0">person</span>
            Personal Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 mobile-text-xs">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none font-semibold disabled:bg-gray-50 disabled:text-gray-600 mobile-px-3 mobile-py-2 mobile-text-sm mobile-rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 mobile-text-xs">Email Address</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-semibold cursor-not-allowed mobile-px-3 mobile-py-2 mobile-text-sm mobile-rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 mobile-text-xs">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none font-semibold disabled:bg-gray-50 disabled:text-gray-600 mobile-px-3 mobile-py-2 mobile-text-sm mobile-rounded"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 mobile-text-xs">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all outline-none font-semibold disabled:bg-gray-50 disabled:text-gray-600 mobile-px-3 mobile-py-2 mobile-text-sm mobile-rounded"
              />
            </div>
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              className="w-full mt-6 py-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mobile-py-3 mobile-text-sm mobile-rounded"
            >
              <span className="material-symbols-outlined">save</span>
              Save Changes
            </button>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200 mobile-rounded mobile-compact">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 font-display mobile-text-xl mobile-text-wrap">
            <span className="material-symbols-outlined text-orange-600 flex-shrink-0">settings</span>
            Settings
          </h3>

          <div className="space-y-4 mobile-space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mobile-p-3 mobile-rounded">
              <div className="flex items-center gap-3 mobile-gap-2 min-w-0">
                <span className="material-symbols-outlined text-cyan-600 flex-shrink-0">notifications</span>
                <span className="font-bold text-gray-900 mobile-text-sm truncate">Notifications</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 flex-shrink-0">chevron_right</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mobile-p-3 mobile-rounded">
              <div className="flex items-center gap-3 mobile-gap-2 min-w-0">
                <span className="material-symbols-outlined text-cyan-600 flex-shrink-0">lock</span>
                <span className="font-bold text-gray-900 mobile-text-sm truncate">Privacy & Security</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 flex-shrink-0">chevron_right</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mobile-p-3 mobile-rounded">
              <div className="flex items-center gap-3 mobile-gap-2 min-w-0">
                <span className="material-symbols-outlined text-cyan-600 flex-shrink-0">language</span>
                <span className="font-bold text-gray-900 mobile-text-sm truncate">Language</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 flex-shrink-0">chevron_right</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mobile-p-3 mobile-rounded">
              <div className="flex items-center gap-3 mobile-gap-2 min-w-0">
                <span className="material-symbols-outlined text-cyan-600 flex-shrink-0">help</span>
                <span className="font-bold text-gray-900 mobile-text-sm truncate">Help & Support</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 flex-shrink-0">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mobile-py-3 mobile-text-sm mobile-rounded"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>

        {/* App Info */}
        <div className="mt-8 text-center text-sm text-gray-500 mobile-text-xs">
          <p className="font-semibold">WinGuard v2.0.0</p>
          <p className="mt-1 mobile-text-wrap">Making India safer, one route at a time</p>
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
            className="flex flex-col items-center text-gray-500 px-5 py-2 hover:bg-gray-50 rounded-2xl transition-all mobile-px-3 mobile-py-1 mobile-rounded"
            aria-label="Alerts"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="text-xs font-bold mt-1">Alerts</span>
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
            className="flex flex-col items-center bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-2xl px-5 py-2 shadow-lg mobile-px-3 mobile-py-1 mobile-rounded"
            aria-label="Profile"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="text-xs font-bold mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ProfilePage;

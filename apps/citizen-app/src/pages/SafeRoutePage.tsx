import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SafeRoutePage() {
  const navigate = useNavigate();
  const [routeType, setRouteType] = useState<'safe' | 'fast'>('safe');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm safe-top">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Safe Route</h1>
        </div>
      </header>

      {/* Map Placeholder */}
      <div className="flex-1 relative bg-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-gray-600">Map will be displayed here</p>
            <p className="text-sm text-gray-500 mt-2">Leaflet integration coming soon</p>
          </div>
        </div>
      </div>

      {/* Route Type Toggle */}
      <div className="bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-4">
            <button
              onClick={() => setRouteType('safe')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                routeType === 'safe'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Safe Route</span>
              </div>
            </button>
            <button
              onClick={() => setRouteType('fast')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                routeType === 'fast'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Fast Route</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedReportForm from '../components/EnhancedReportForm';

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [showForm] = useState(true);

  const handleSuccess = () => {
    setTimeout(() => {
      navigate('/map');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200 safe-top sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/map')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Win</span>
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Guard</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">Report Safety Issue</p>
          </div>
        </div>
      </header>

      {/* Enhanced Report Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <EnhancedReportForm
          isOpen={showForm}
          onClose={() => navigate('/map')}
          onSuccess={handleSuccess}
        />
      </main>
    </div>
  );
}

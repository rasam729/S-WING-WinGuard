import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    issueType: 'pothole',
    description: '',
    userSeverity: 5,
    photo: null as File | null,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, photo: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const formDataToSend = new FormData();
      formDataToSend.append('issueType', formData.issueType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('userSeverity', formData.userSeverity.toString());
      formDataToSend.append('latitude', position.coords.latitude.toString());
      formDataToSend.append('longitude', position.coords.longitude.toString());
      formDataToSend.append('timestamp', new Date().toISOString());
      
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      await apiService.createReport(formDataToSend);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-xl font-bold text-gray-900">Report Safety Issue</h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {success ? (
          <div className="card bg-green-50 border border-green-200">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-green-900">Report Submitted!</h3>
                <p className="text-sm text-green-700">City officials have been notified.</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Issue Type */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                className="input"
              >
                <option value="pothole">Pothole</option>
                <option value="streetlight">Broken Streetlight</option>
                <option value="crime">Crime/Safety Concern</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[100px]"
                placeholder="Describe the issue..."
                required
              />
            </div>

            {/* Severity */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity: {formData.userSeverity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.userSeverity}
                onChange={(e) => setFormData({ ...formData, userSeverity: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Minor</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo Evidence
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="w-full"
                required
              />
              {formData.photo && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {formData.photo.name}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full touch-button"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

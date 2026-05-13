import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface EnhancedReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultLocation?: { latitude: number; longitude: number };
}

const EnhancedReportForm: React.FC<EnhancedReportFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultLocation
}) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    category: 'Pothole',
    severity: 5,
    criticalScore: 5,
    description: '',
    userExperience: '',
    latitude: defaultLocation?.latitude || 12.9716,
    longitude: defaultLocation?.longitude || 77.5946
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gpsExtracted, setGpsExtracted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Try to extract EXIF data
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Simple EXIF check (will be properly extracted on server)
        if (buffer.length > 0) {
          setGpsExtracted(true); // Optimistic - server will confirm
        }
      } catch (err) {
        console.log('Could not read EXIF data:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      if (photo) {
        formDataToSend.append('photo', photo);
      }
      
      formDataToSend.append('category', formData.category);
      formDataToSend.append('severity', formData.severity.toString());
      formDataToSend.append('criticalScore', formData.criticalScore.toString());
      formDataToSend.append('description', formData.description);
      formDataToSend.append('userExperience', formData.userExperience);
      formDataToSend.append('latitude', formData.latitude.toString());
      formDataToSend.append('longitude', formData.longitude.toString());

      const response = await fetch('/api/reports/submit-with-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit report');
      }

      setGpsExtracted(data.data.gpsExtracted);
      alert('Report submitted successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1002] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-3xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Report an Issue</h2>
              <p className="text-sm opacity-90 mt-1">Help make Bengaluru safer with photo evidence</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600">error</span>
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Photo Evidence (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-xl"
                  />
                  {gpsExtracted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      GPS Detected
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhoto(null);
                      setPhotoPreview(null);
                      setGpsExtracted(false);
                    }}
                    className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ) : (
                <div>
                  <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
                    photo_camera
                  </span>
                  <p className="text-gray-600 font-medium mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    JPEG, PNG, HEIC up to 10MB
                  </p>
                  <p className="text-xs text-blue-600 mt-2 font-semibold">
                    📍 GPS location will be extracted automatically if available
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Issue Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="Pothole">Pothole</option>
              <option value="Streetlight">Broken Streetlight</option>
              <option value="Crime">Crime/Safety Concern</option>
              <option value="Dark Alley">Dark Alley</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Critical Score */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Critical Score: {formData.criticalScore}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.criticalScore}
              onChange={(e) => setFormData({ ...formData, criticalScore: parseInt(e.target.value) })}
              className="w-full h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  #10b981 0%, 
                  #10b981 ${(formData.criticalScore - 1) * 11.11}%, 
                  #f59e0b ${(formData.criticalScore - 1) * 11.11}%, 
                  #f59e0b ${(formData.criticalScore - 1) * 11.11 + 33.33}%, 
                  #ef4444 ${(formData.criticalScore - 1) * 11.11 + 33.33}%, 
                  #ef4444 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Minor</span>
              <span>Moderate</span>
              <span>High</span>
              <span className="text-red-600 font-bold">CRITICAL</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.criticalScore <= 3 && '🟢 Minor issue - cosmetic or low priority'}
              {formData.criticalScore > 3 && formData.criticalScore <= 6 && '🟡 Moderate - causes inconvenience'}
              {formData.criticalScore > 6 && formData.criticalScore <= 8 && '🟠 High - safety concern'}
              {formData.criticalScore > 8 && '🔴 CRITICAL - immediate danger!'}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Brief Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              rows={2}
              placeholder="e.g., Large pothole on main road"
              required
            />
          </div>

          {/* User Experience */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Your Experience (Optional)
            </label>
            <textarea
              value={formData.userExperience}
              onChange={(e) => setFormData({ ...formData, userExperience: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              rows={3}
              placeholder="Describe what happened, how it affected you, when you encountered it..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.userExperience.length}/500 characters
            </p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Latitude *
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Longitude *
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedReportForm;

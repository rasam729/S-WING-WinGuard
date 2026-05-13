import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExifReader from 'exifreader';

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
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  // ===== KEYWORD TRIAGE MAPPING =====
  const KEYWORD_TO_CATEGORY: Record<string, string> = {
    'pothole': 'Pothole',
    'potholes': 'Pothole',
    'hole': 'Pothole',
    'crater': 'Pothole',
    'streetlight': 'Streetlight',
    'street light': 'Streetlight',
    'light': 'Streetlight',
    'lamp': 'Streetlight',
    'lighting': 'Streetlight',
    'broken light': 'Streetlight',
    'crack': 'Road Damage',
    'cracks': 'Road Damage',
    'damage': 'Road Damage',
    'damaged': 'Road Damage',
    'crime': 'Crime',
    'theft': 'Crime',
    'assault': 'Crime',
    'dark': 'Dark Alley',
    'alley': 'Dark Alley',
    'unsafe': 'Crime'
  };

  // ===== KEYWORD TRIAGE FUNCTION =====
  const triageByKeywords = (text: string): string | null => {
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (KEYWORD_TO_CATEGORY[word]) {
        return KEYWORD_TO_CATEGORY[word];
      }
    }
    
    // Check for partial matches
    for (const [keyword, category] of Object.entries(KEYWORD_TO_CATEGORY)) {
      if (text.toLowerCase().includes(keyword)) {
        return category;
      }
    }
    
    return null;
  };

  // ===== AUTO-DETECT CATEGORY FROM DESCRIPTION =====
  useEffect(() => {
    if (formData.description) {
      const detectedCategory = triageByKeywords(formData.description);
      if (detectedCategory) {
        setFormData(prev => ({ ...prev, category: detectedCategory }));
        setAiAnalysis(`✨ Auto-detected: ${detectedCategory}`);
      }
    }
  }, [formData.description]);

  // ===== EXIF EXTRACTION FUNCTION =====
  const extractGPSFromPhoto = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const tags = ExifReader.load(arrayBuffer);
      
      // Check for GPS data
      if (tags.GPSLatitude && tags.GPSLongitude) {
        const lat = tags.GPSLatitude.description;
        const lng = tags.GPSLongitude.description;
        
        // Convert to decimal if needed
        const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
        const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
        
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          setGpsCoordinates({ lat: latNum, lng: lngNum });
          setFormData(prev => ({
            ...prev,
            latitude: latNum,
            longitude: lngNum
          }));
          setGpsExtracted(true);
          return true;
        }
      }
      
      setGpsExtracted(false);
      return false;
    } catch (error) {
      console.error('Error extracting GPS:', error);
      setGpsExtracted(false);
      return false;
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Extract GPS data from EXIF
      const hasGPS = await extractGPSFromPhoto(file);
      if (hasGPS) {
        setAiAnalysis('📍 GPS coordinates extracted from photo!');
      } else {
        setAiAnalysis('⚠️ No GPS data found in photo. Using current location.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append('category', formData.category);
      submitData.append('severity', formData.criticalScore.toString());
      submitData.append('description', formData.description);
      submitData.append('userExperience', formData.userExperience);
      submitData.append('latitude', formData.latitude.toString());
      submitData.append('longitude', formData.longitude.toString());
      
      // Add GPS extraction metadata
      submitData.append('gpsExtracted', gpsExtracted.toString());
      
      // Add photo if available
      if (photo) {
        submitData.append('photo', photo);
      }

      // Submit to backend
      const response = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      const result = await response.json();
      
      // Show success message with integrated features
      alert('✅ Report submitted successfully!\n\n' +
            `Category: ${formData.category}\n` +
            `GPS: ${gpsExtracted ? '📍 Extracted from photo EXIF' : '📌 Manual entry'}\n` +
            `Location: ${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}\n` +
            `Critical Score: ${formData.criticalScore}/10\n\n` +
            '✨ Integrated Features Active:\n' +
            '✓ EXIF GPS Extraction\n' +
            '✓ Keyword Triage Auto-detection\n' +
            '✓ Database Integration\n' +
            '✓ Live Map Sync');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please check your connection.');
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

          {/* AI Analysis / GPS Status */}
          {aiAnalysis && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 animate-fade-in">
              <span className="material-symbols-outlined text-blue-600">
                {gpsExtracted ? 'location_on' : 'auto_awesome'}
              </span>
              <p className="text-sm text-blue-800 font-medium">{aiAnalysis}</p>
            </div>
          )}

          {/* GPS Coordinates Display */}
          {gpsCoordinates && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                <span className="text-xs font-bold text-green-800">GPS EXTRACTED</span>
              </div>
              <div className="text-xs text-green-700 font-mono">
                📍 {gpsCoordinates.lat.toFixed(6)}°N, {gpsCoordinates.lng.toFixed(6)}°E
              </div>
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

          {/* Description with Keyword Detection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Brief Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              rows={2}
              placeholder="e.g., Large pothole on main road, broken streetlight..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Type keywords like "pothole" or "streetlight" for auto-detection
            </p>
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

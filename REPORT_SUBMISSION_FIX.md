# 🔧 Report Submission & Voice Navigation Fixes

## Issues Fixed

### 1. ✅ Report Submission "Failed to Fetch" Error

**Problem:**
- Report submission was failing with "Failed to fetch" error
- Reports were not appearing on the dashboard map

**Root Cause:**
- Using absolute URL `http://localhost:3000/api/reports` instead of relative URL `/api/reports`
- This bypassed the Vite proxy configuration
- CORS issues and connection problems

**Solution:**
Changed the fetch URL from absolute to relative:

```typescript
// Before (WRONG)
const response = await fetch('http://localhost:3000/api/reports', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: submitData
});

// After (CORRECT)
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: submitData
});
```

**Why This Works:**
- Vite proxy configuration in `vite.config.ts` automatically forwards `/api/*` requests to `http://localhost:3000`
- Avoids CORS issues
- Consistent with other API calls in the app (login, register)

---

### 2. ✅ Enhanced Error Handling

**Added:**
- Token validation before submission
- Better error messages
- Console logging for debugging
- Login redirect button if not authenticated

**Code:**
```typescript
// Check if token exists
if (!token) {
  throw new Error('You must be logged in to submit a report. Please login first.');
}

// Better error display
{error && (
  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-shake">
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-red-600 text-2xl">error</span>
      <div className="flex-1">
        <p className="text-sm text-red-800 font-bold mb-1">Failed to Submit Report</p>
        <p className="text-sm text-red-700">{error}</p>
        {error.includes('login') && (
          <button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </button>
        )}
      </div>
    </div>
  </div>
)}
```

---

### 3. ✅ Female Voice for Navigation Directions

**Problem:**
- Voice directions were using default (often male) voice

**Solution:**
Enhanced the Text-to-Speech setup to select a female voice:

```typescript
// Text-to-Speech setup with female voice
useEffect(() => {
  if ('speechSynthesis' in window) {
    speechSynthRef.current = new SpeechSynthesisUtterance();
    speechSynthRef.current.rate = 0.9;
    speechSynthRef.current.pitch = 1.1; // Slightly higher pitch for female voice
    speechSynthRef.current.volume = 1;
    
    // Wait for voices to load and select a female voice
    const setFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a female voice
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.name.toLowerCase().includes('google uk english female') ||
        (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('female'))
      );
      
      if (femaleVoice) {
        speechSynthRef.current!.voice = femaleVoice;
        console.log('Selected female voice:', femaleVoice.name);
      } else {
        // Fallback: use any voice with higher pitch
        console.log('No specific female voice found, using default with adjusted pitch');
      }
    };
    
    // Voices might not be loaded immediately
    if (window.speechSynthesis.getVoices().length > 0) {
      setFemaleVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setFemaleVoice;
    }
  }
}, []);
```

**Features:**
- Searches for female voices by name (Zira, Samantha, Karen, Victoria, Google Female)
- Falls back to higher pitch if no female voice found
- Logs selected voice to console for debugging
- Handles async voice loading

**Common Female Voices:**
- **Windows:** Microsoft Zira
- **macOS:** Samantha, Karen, Victoria
- **Chrome:** Google UK English Female, Google US English Female
- **Android:** Various female voices depending on language

---

## Files Modified

### 1. `apps/citizen-app/src/components/EnhancedReportForm.tsx`
**Changes:**
- Fixed fetch URL (absolute → relative)
- Added token validation
- Enhanced error handling
- Added console logging
- Improved error display with login redirect

### 2. `apps/citizen-app/src/components/NavigationEngine.tsx`
**Changes:**
- Enhanced Text-to-Speech setup
- Added female voice selection
- Increased pitch for female voice (1.1)
- Added voice loading handler
- Added console logging for selected voice

---

## Testing Guide

### Test Report Submission:

1. **Ensure Backend is Running:**
   ```bash
   # In server directory
   npm run dev
   # Should be running on port 3000
   ```

2. **Ensure Citizen App is Running:**
   ```bash
   # In apps/citizen-app directory
   npm run dev
   # Should be running on port 5176
   ```

3. **Login First:**
   - Navigate to: http://localhost:5176/auth
   - Login with: citizen@winguard.com / citizen123
   - Verify you're logged in

4. **Submit a Report:**
   - Navigate to: http://localhost:5176/report
   - Fill in the form:
     - Category: Pothole
     - Description: "Large pothole on main road"
     - Critical Score: 7
     - Latitude: 12.9716
     - Longitude: 77.5946
   - Click "Submit Report"
   - Should see success message
   - Should redirect to map

5. **Verify on Dashboard:**
   - Open: http://localhost:5177
   - Login as official: official@bengaluru.gov.in / official123
   - Check map for new marker at coordinates
   - Verify report appears in reports list

6. **Check Console:**
   - Open browser DevTools (F12)
   - Check Console tab for:
     - "Submitting report with data: ..."
     - "Server response: ..."
   - Should see no errors

### Test Female Voice Navigation:

1. **Open Navigation:**
   - Navigate to map page
   - Click navigation button (compass icon)

2. **Calculate Route:**
   - Search for start location: "MG Road"
   - Search for destination: "Koramangala"
   - Click "Find Safe Routes"
   - Select a route
   - Click "Start Navigation"

3. **Test Voice:**
   - Click speaker icon on first instruction
   - Should hear female voice
   - Check browser console for: "Selected female voice: [name]"

4. **Verify Voice:**
   - Voice should sound female
   - If not, check available voices:
     ```javascript
     // In browser console
     speechSynthesis.getVoices().forEach(v => console.log(v.name, v.lang))
     ```

---

## Troubleshooting

### Report Submission Still Failing:

**Check 1: Backend Running**
```bash
# Check if backend is running
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

**Check 2: Token Exists**
```javascript
// In browser console
localStorage.getItem('winguard_token')
// Should return a JWT token string
```

**Check 3: Network Tab**
- Open DevTools > Network
- Submit report
- Check request to `/api/reports`
- Look at:
  - Request Headers (should have Authorization)
  - Response (should be 201 Created)
  - Response body (should have success: true)

**Check 4: CORS**
- If you see CORS errors, ensure:
  - Backend has CORS enabled
  - Using relative URL `/api/reports` (not absolute)
  - Proxy is configured in vite.config.ts

### Female Voice Not Working:

**Check 1: Available Voices**
```javascript
// In browser console
speechSynthesis.getVoices().forEach(voice => {
  console.log(voice.name, voice.lang, voice.gender || 'unknown');
});
```

**Check 2: Browser Support**
- Chrome: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

**Check 3: System Voices**
- **Windows:** Install additional voices in Settings > Time & Language > Speech
- **macOS:** Voices are pre-installed
- **Linux:** Install espeak or festival

**Check 4: Fallback**
- If no female voice found, uses higher pitch (1.1)
- Still sounds more feminine than default

---

## API Endpoint Details

### POST /api/reports

**Request:**
```
POST /api/reports
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body (FormData):
- category: string (required)
- severity: number (required, 1-10)
- description: string (required)
- userExperience: string (optional)
- latitude: number (required)
- longitude: number (required)
- gpsExtracted: boolean (optional)
- photo: File (optional)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "reportId": 123,
    "category": "Pothole",
    "severity": 7,
    "description": "Large pothole on main road",
    "createdAt": "2026-05-13T10:30:00Z",
    "gpsExtracted": false
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Missing required fields: category, severity, description, latitude, longitude"
}
```

---

## Database Integration

### Reports Table Schema:
```sql
CREATE TABLE reports (
  report_id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  severity INTEGER NOT NULL,
  description TEXT NOT NULL,
  user_id INTEGER REFERENCES users(user_id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  photo_url VARCHAR(255),
  photo_metadata JSONB,
  user_experience TEXT,
  critical_score INTEGER,
  report_status VARCHAR(50) DEFAULT 'Received',
  status VARCHAR(50) DEFAULT 'Report Received',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### PostGIS Query:
```sql
-- Insert report with location
INSERT INTO reports (
  category, severity, description, user_id,
  location,
  photo_url, photo_metadata, user_experience, critical_score,
  report_status, status, created_at
) VALUES (
  'Pothole', 7, 'Large pothole on main road', 1,
  ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography,
  '/uploads/report-123.jpg', '{"gpsExtracted": true}', 'Hit my bike', 7,
  'Received', 'Report Received', CURRENT_TIMESTAMP
);

-- Query reports with location
SELECT 
  report_id,
  category,
  severity,
  description,
  ST_X(location::geometry) as longitude,
  ST_Y(location::geometry) as latitude,
  created_at
FROM reports
ORDER BY created_at DESC;
```

---

## Success Criteria

### Report Submission:
- ✅ Form submits without errors
- ✅ Success message appears
- ✅ Redirects to map page
- ✅ Report appears in database
- ✅ Report appears on dashboard map
- ✅ GPS coordinates are correct
- ✅ Photo is uploaded (if provided)
- ✅ Category is correct
- ✅ Critical score is saved

### Female Voice:
- ✅ Voice sounds female
- ✅ Console shows selected voice name
- ✅ Voice is clear and understandable
- ✅ Pitch is appropriate (1.1)
- ✅ Rate is comfortable (0.9)
- ✅ Volume is audible (1.0)

---

## Summary

### Fixed Issues:
1. ✅ Report submission "Failed to fetch" error
2. ✅ Reports not appearing on dashboard
3. ✅ Voice directions now use female voice
4. ✅ Enhanced error handling
5. ✅ Better debugging with console logs

### Files Modified:
1. `apps/citizen-app/src/components/EnhancedReportForm.tsx`
2. `apps/citizen-app/src/components/NavigationEngine.tsx`

### Testing:
- Test report submission with login
- Verify report appears on dashboard
- Test voice navigation with female voice
- Check console for logs

---

**Status:** All fixes complete! ✅
**Date:** May 13, 2026

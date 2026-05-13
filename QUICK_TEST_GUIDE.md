# 🧪 Quick Test Guide - Report Submission & Female Voice

## Prerequisites

### 1. Start Backend Server
```bash
cd server
npm run dev
# Should see: Server running on port 3000
```

### 2. Start Citizen App
```bash
cd apps/citizen-app
npm run dev
# Should see: Local: http://localhost:5176
```

### 3. Start Dashboard (Optional)
```bash
cd apps/official-dashboard
npm run dev
# Should see: Local: http://localhost:5177
```

---

## Test 1: Report Submission ✅

### Step 1: Login
1. Open: http://localhost:5176/auth
2. Enter credentials:
   - Email: `citizen@winguard.com`
   - Password: `citizen123`
3. Click "Sign In to WinGuard"
4. Should redirect to map page

### Step 2: Navigate to Report Page
1. Click "Report" button in bottom navigation
2. OR navigate to: http://localhost:5176/report
3. Should see "Report an Issue" form

### Step 3: Fill Report Form
1. **Photo (Optional):**
   - Click upload area
   - Select a geotagged photo
   - Should see GPS badge if coordinates found

2. **Category:**
   - Select "Pothole" (or auto-detected from description)

3. **Critical Score:**
   - Drag slider to 7/10
   - Should see "🟠 High - safety concern"

4. **Description:**
   - Type: "Large pothole on main road"
   - Should see auto-detection message

5. **User Experience (Optional):**
   - Type: "Hit my bike and damaged tire"

6. **Location:**
   - Latitude: `12.9716`
   - Longitude: `77.5946`
   - (Or extracted from photo GPS)

### Step 4: Submit Report
1. Click "Submit Report" button
2. Should see loading spinner
3. Wait for success message
4. Should see alert with:
   ```
   ✅ Report submitted successfully!
   
   Category: Pothole
   GPS: 📍 Extracted from photo EXIF (or 📌 Manual entry)
   Location: 12.9716, 77.5946
   Critical Score: 7/10
   
   ✨ Your report will appear on the dashboard map shortly!
   ```
5. Should redirect to map page

### Step 5: Verify on Dashboard
1. Open: http://localhost:5177
2. Login with:
   - Email: `official@bengaluru.gov.in`
   - Password: `official123`
3. Check map for new marker at coordinates (12.9716, 77.5946)
4. Click marker to see report details
5. Verify:
   - Category: Pothole
   - Description: "Large pothole on main road"
   - Critical Score: 7
   - Status: Report Received

### Expected Results:
- ✅ No "Failed to fetch" error
- ✅ Success message appears
- ✅ Report appears on dashboard map
- ✅ All data is correct
- ✅ Photo uploaded (if provided)

---

## Test 2: Female Voice Navigation 🔊

### Step 1: Open Navigation
1. Go to map page: http://localhost:5176/map
2. Click navigation button (compass icon)
3. Should see "Guardian Path Navigator" modal

### Step 2: Search Locations
1. **Start Location:**
   - Type: "MG Road"
   - Wait for dropdown
   - Select: "MG Road, Bengaluru, India"
   - Should see coordinates filled

2. **Destination:**
   - Type: "Koramangala"
   - Wait for dropdown
   - Select: "Koramangala, Bengaluru, India"
   - Should see coordinates filled

### Step 3: Calculate Routes
1. Click "Find Safe Routes"
2. Wait for calculation
3. Should see 2 route options:
   - Guardian Path (green)
   - Alternative Route (blue)
4. Each should show:
   - Time (minutes)
   - Distance (km)
   - Safety Score
   - Hazards count

### Step 4: Start Navigation
1. Select "Guardian Path"
2. Click "Start Navigation"
3. Should see first instruction

### Step 5: Test Voice
1. Click speaker icon (🔊)
2. Should hear female voice saying instruction
3. Check browser console for:
   ```
   Selected female voice: [Voice Name]
   ```
4. Voice should sound:
   - Female (or higher pitch)
   - Clear and understandable
   - Natural pace (0.9 rate)

### Step 6: Test Navigation
1. Click "Next" button
2. Should hear next instruction in female voice
3. Click "Previous" button
4. Should hear previous instruction
5. Click speaker icon anytime to repeat

### Expected Results:
- ✅ Voice sounds female
- ✅ Voice is clear and understandable
- ✅ Console shows selected voice
- ✅ All instructions work
- ✅ Speaker icon works

---

## Troubleshooting

### Issue: "Failed to fetch" Error

**Solution 1: Check Backend**
```bash
# Test backend is running
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

**Solution 2: Check Token**
```javascript
// In browser console (F12)
localStorage.getItem('winguard_token')
// Should return a long string (JWT token)
// If null, login again
```

**Solution 3: Check Network**
1. Open DevTools (F12)
2. Go to Network tab
3. Submit report
4. Look for `/api/reports` request
5. Check:
   - Status: Should be 201
   - Response: Should have `success: true`
   - Headers: Should have `Authorization: Bearer ...`

**Solution 4: Clear Cache**
```javascript
// In browser console
localStorage.clear()
// Then login again
```

---

### Issue: No Female Voice

**Solution 1: Check Available Voices**
```javascript
// In browser console (F12)
speechSynthesis.getVoices().forEach(voice => {
  console.log(voice.name, voice.lang);
});
// Look for voices with "Female", "Zira", "Samantha", etc.
```

**Solution 2: Install System Voices**

**Windows:**
1. Settings > Time & Language > Speech
2. Click "Add voices"
3. Install "Microsoft Zira" or other female voices

**macOS:**
- Female voices pre-installed (Samantha, Karen, Victoria)

**Linux:**
```bash
sudo apt-get install espeak
# Or
sudo apt-get install festival
```

**Solution 3: Use Chrome**
- Chrome has best voice support
- Includes Google Female voices

**Solution 4: Check Console**
- Look for: "Selected female voice: [name]"
- If says "No specific female voice found", using higher pitch fallback

---

### Issue: Report Not on Dashboard

**Solution 1: Refresh Dashboard**
1. Go to dashboard: http://localhost:5177
2. Press F5 to refresh
3. Check map again

**Solution 2: Check Database**
```sql
-- In PostgreSQL
SELECT * FROM reports ORDER BY created_at DESC LIMIT 5;
-- Should see your report
```

**Solution 3: Check Coordinates**
- Verify latitude/longitude are correct
- Should be around Bengaluru (12.9716, 77.5946)
- Check if marker is outside visible map area

**Solution 4: Check Backend Logs**
```bash
# In server terminal
# Look for:
# POST /api/reports 201
# Should see successful creation
```

---

## Console Debugging

### Check Report Submission:
```javascript
// Should see in console:
Submitting report with data: {
  category: "Pothole",
  severity: 7,
  latitude: 12.9716,
  longitude: 77.5946,
  hasPhoto: false,
  gpsExtracted: false
}

Server response: {
  success: true,
  message: "Report submitted successfully",
  data: { ... }
}
```

### Check Female Voice:
```javascript
// Should see in console:
Selected female voice: Microsoft Zira Desktop - English (United States)
// Or
Selected female voice: Google UK English Female
// Or
No specific female voice found, using default with adjusted pitch
```

---

## Quick Checklist

### Before Testing:
- [ ] Backend running on port 3000
- [ ] Citizen app running on port 5176
- [ ] Dashboard running on port 5177 (optional)
- [ ] Logged in as citizen

### Report Submission:
- [ ] Form loads without errors
- [ ] Can fill all fields
- [ ] Submit button works
- [ ] Success message appears
- [ ] Redirects to map
- [ ] Report on dashboard

### Female Voice:
- [ ] Navigation opens
- [ ] Can search locations
- [ ] Routes calculate
- [ ] Voice sounds female
- [ ] All instructions work
- [ ] Console shows voice name

---

## Success Criteria

### Report Submission: ✅
- No "Failed to fetch" error
- Success message with details
- Report appears on dashboard map
- Coordinates are correct
- Category is correct
- Critical score is saved

### Female Voice: ✅
- Voice sounds female (or higher pitch)
- Voice is clear and understandable
- Console shows selected voice
- All navigation features work
- Speaker icon repeats instruction

---

## Need Help?

### Check Documentation:
1. `REPORT_SUBMISSION_FIX.md` - Detailed fix explanation
2. `IMPLEMENTATION_STATUS.md` - Overall progress
3. `UI_ENHANCEMENT_SUMMARY.md` - UI changes

### Check Console:
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Check Backend:
- Look at server terminal for errors
- Check database for reports
- Verify API endpoints working

---

**Status:** Ready for testing! ✅
**Date:** May 13, 2026

**Quick Test:**
1. Login → Report → Submit → Check Dashboard ✅
2. Navigate → Search → Route → Voice ✅

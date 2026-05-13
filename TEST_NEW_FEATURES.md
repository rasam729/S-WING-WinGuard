# Testing Guide - New Features from Merge

## 🎯 Quick Test Checklist

### 1. Test EXIF GPS Extraction
**Steps:**
1. Open Citizen App: `http://localhost:5173` or `http://172.17.0.79:5173`
2. Login with: `citizen@winguard.com` / `citizen123`
3. Navigate to "Report Issue" page
4. Upload a geotagged photo (taken with smartphone camera with location enabled)
5. **Expected Result:**
   - Green badge appears: "GPS Detected"
   - Coordinates display: "📍 GPS EXTRACTED"
   - Latitude and longitude fields auto-populate
   - Success message: "📍 GPS coordinates extracted from photo!"

### 2. Test Keyword Auto-Detection
**Steps:**
1. In the report form, type in the description field:
   - "There is a large **pothole** on the road"
   - OR "The **streetlight** is broken"
   - OR "Road has multiple **cracks**"
2. **Expected Result:**
   - Category dropdown automatically changes to match keyword
   - AI analysis shows: "✨ Auto-detected: [Category]"

**Keyword Mappings:**
- "pothole", "hole", "crater" → Pothole
- "streetlight", "light", "lamp" → Streetlight
- "crack", "damage" → Road Damage
- "crime", "theft", "assault" → Crime
- "dark", "alley" → Dark Alley

### 3. Test Report Submission Flow
**Steps:**
1. Fill out complete report form:
   - Upload photo (with or without GPS)
   - Select category (or let auto-detect work)
   - Set critical score (1-10)
   - Add description
   - Add user experience (optional)
   - Verify coordinates
2. Click "Submit Report"
3. **Expected Result:**
   - Success alert with all details
   - Report appears on Official Dashboard
   - Map marker added at coordinates
   - Photo visible in reports list

### 4. Test Official Dashboard Integration
**Steps:**
1. Open Official Dashboard: `http://localhost:5174` or `http://172.17.0.79:5174`
2. Login with: `official@bengaluru.gov.in` / `official123`
3. Navigate to "Reports" page
4. **Expected Result:**
   - All submitted reports visible
   - Photo thumbnails displayed
   - GPS extraction status shown
   - Critical score visible
   - User experience text displayed
   - Coordinates accurate

### 5. Test Role-Based Access
**Citizen View:**
1. Login as citizen
2. Navigate to reports/profile
3. **Expected:** See only YOUR reports

**Official View:**
1. Login as official
2. Navigate to reports page
3. **Expected:** See ALL reports from all citizens

### 6. Test Database Integration
**Verify PostgreSQL:**
```bash
# Check if reports are stored in database
# Backend should show in console:
✓ PostgreSQL connected successfully
✓ PostGIS version: 3.5
✓ Found tables: reports, budgets, departments
```

**API Endpoints to Test:**
- `GET http://localhost:3000/api/reports` - Get user's reports (with auth)
- `GET http://localhost:3000/api/reports/all` - Get all reports
- `POST http://localhost:3000/api/reports` - Submit new report

---

## 🧪 Test Scenarios

### Scenario 1: Mobile Photo with GPS
1. Take photo with smartphone (GPS enabled)
2. Transfer to computer or access app from mobile
3. Upload photo in report form
4. Verify GPS extraction works
5. Submit report
6. Check dashboard for accurate location

### Scenario 2: Photo without GPS
1. Upload photo without EXIF GPS data
2. Verify warning: "⚠️ No GPS data found in photo"
3. Manually enter coordinates
4. Submit report
5. Verify manual coordinates used

### Scenario 3: Keyword Detection
1. Type "pothole" in description
2. Verify category changes to "Pothole"
3. Type "streetlight" in description
4. Verify category changes to "Streetlight"
5. Submit with auto-detected category

### Scenario 4: Critical Score Levels
Test each severity level:
- Score 1-3: 🟢 Minor (green)
- Score 4-6: 🟡 Moderate (yellow)
- Score 7-8: 🟠 High (orange)
- Score 9-10: 🔴 CRITICAL (red)

### Scenario 5: End-to-End Flow
1. Citizen submits report with photo
2. GPS extracted automatically
3. Category auto-detected from keywords
4. Report stored in PostgreSQL
5. WebSocket notifies dashboard
6. Official sees new report immediately
7. Map marker appears at correct location
8. Photo visible in report details

---

## 🔍 Debugging Tips

### If GPS Extraction Fails:
- Check if photo has EXIF data (use online EXIF viewer)
- Verify ExifReader library is installed: `npm list exifreader`
- Check browser console for errors
- Ensure photo format is JPEG/PNG/HEIC

### If Report Submission Fails:
- Check backend is running on port 3000
- Verify PostgreSQL connection in backend logs
- Check JWT token in localStorage
- Verify API endpoint: `/api/reports` (not `/api/reports/submit-with-photo`)

### If Dashboard Doesn't Update:
- Check WebSocket connection in browser console
- Verify Socket.io is running on backend
- Check CORS settings allow your origin
- Refresh dashboard page

### If Photos Don't Display:
- Check `/uploads` directory exists in server folder
- Verify static file serving: `app.use('/uploads', express.static(...))`
- Check photo URL format: `/uploads/report-[timestamp]-[random].[ext]`
- Verify file permissions on uploads directory

---

## 📊 Expected Database Records

### Reports Table Entry:
```json
{
  "report_id": 1,
  "category": "Pothole",
  "severity": 8,
  "description": "Large pothole on MG Road",
  "user_id": 1,
  "location": "POINT(77.5946 12.9716)",
  "photo_url": "/uploads/report-1234567890-123456789.jpg",
  "photo_metadata": {
    "filename": "report-1234567890-123456789.jpg",
    "size": 2048576,
    "mimetype": "image/jpeg",
    "gpsExtracted": true
  },
  "user_experience": "Hit the pothole while driving, damaged tire",
  "critical_score": 8,
  "report_status": "Received",
  "status": "Report Received",
  "created_at": "2026-05-13T12:00:00Z"
}
```

---

## ✅ Success Indicators

### Frontend:
- ✅ GPS badge appears on geotagged photos
- ✅ Coordinates auto-populate from EXIF
- ✅ Category auto-detects from keywords
- ✅ AI analysis feedback displays
- ✅ Photo preview shows with delete option
- ✅ Success alert shows all details

### Backend:
- ✅ Report stored in PostgreSQL
- ✅ Photo saved to `/uploads` directory
- ✅ PostGIS location data correct
- ✅ Photo metadata JSON stored
- ✅ WebSocket emits update event
- ✅ No errors in server logs

### Dashboard:
- ✅ New report appears immediately
- ✅ Photo thumbnail displays
- ✅ Map marker at correct location
- ✅ All report details visible
- ✅ GPS extraction status shown
- ✅ Critical score color-coded

---

## 🚨 Common Issues

### Issue: "Failed to submit report"
**Solution:** Check backend is running and PostgreSQL is connected

### Issue: GPS not extracted
**Solution:** Ensure photo has EXIF GPS data (take with phone camera, location enabled)

### Issue: Category not auto-detecting
**Solution:** Type exact keywords: "pothole", "streetlight", "crack", etc.

### Issue: Photo not displaying on dashboard
**Solution:** Check `/uploads` directory exists and has correct permissions

### Issue: "Backend server is not running"
**Solution:** Start backend: `cd server && npm run dev`

---

## 📱 Mobile Testing

### Access from Mobile:
1. Connect to same WiFi network as development machine
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access: `http://[YOUR_IP]:5173`
4. Example: `http://172.17.0.79:5173`

### Mobile Photo Upload:
1. Open citizen app on mobile browser
2. Login with credentials
3. Navigate to report form
4. Click photo upload
5. Choose "Take Photo" or "Choose from Gallery"
6. Select photo with location data
7. Verify GPS extraction works on mobile

---

**Ready to test! Start with Scenario 1 for best results.** 🚀

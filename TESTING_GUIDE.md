# WinGuard Testing Guide 🧪

## Quick Start Testing

### Prerequisites
- ✅ Backend server running on `http://localhost:3000`
- ✅ Frontend running on `http://localhost:5173`
- ✅ Neon PostgreSQL database connected
- ✅ JWT_SECRET configured in `.env`

---

## Test Suite 1: Authentication Flow

### Test 1.1: User Registration
1. Navigate to `http://localhost:5173`
2. Click "Sign Up" tab
3. Fill in:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "Test123!"
4. Click "Create Account"
5. **Expected**: Success message, redirect to map

### Test 1.2: User Login
1. Navigate to `http://localhost:5173`
2. Enter credentials:
   - Email: "test@example.com"
   - Password: "Test123!"
3. Click "Sign In"
4. **Expected**: Redirect to map, see "Welcome, Test User" in header

### Test 1.3: Protected Routes
1. Try accessing map without login
2. **Expected**: Redirect to login page
3. After login, access should be granted

### Test 1.4: Logout
1. Click logout button (🚪) in header
2. **Expected**: Redirect to login page, token cleared

---

## Test Suite 2: Enhanced Report Form

### Test 2.1: Open Report Form
1. Login to application
2. Click red "Report Issue" FAB (bottom right)
3. **Expected**: Modal opens with form

### Test 2.2: Photo Upload (Without GPS)
1. Open report form
2. Click photo upload area
3. Select a regular photo (no GPS data)
4. **Expected**: 
   - Photo preview appears
   - No GPS badge shown
   - Delete button visible

### Test 2.3: Photo Upload (With GPS)
1. Open report form
2. Upload a photo with EXIF GPS data
3. **Expected**:
   - Photo preview appears
   - Green "GPS Detected" badge shown
   - Latitude/Longitude auto-filled
   - Delete button visible

### Test 2.4: Critical Score Slider
1. Open report form
2. Move critical score slider from 1 to 10
3. **Expected**:
   - Slider color changes (green → yellow → red)
   - Label updates (Minor → Moderate → High → CRITICAL)
   - Description text changes

### Test 2.5: Form Validation
1. Open report form
2. Try submitting without required fields
3. **Expected**: Validation errors shown

### Test 2.6: Submit Report
1. Fill all required fields:
   - Category: "Pothole"
   - Critical Score: 7
   - Description: "Large pothole on main road"
   - User Experience: "Hit it while driving, damaged tire"
   - Location: Use current location
2. Click "Submit Report"
3. **Expected**:
   - Loading spinner appears
   - Success message shown
   - Modal closes
   - New marker appears on map

### Test 2.7: Submit Critical Report
1. Create report with critical score 9 or 10
2. Submit report
3. **Expected**:
   - Report submitted
   - Notification sent to officials
   - Red marker on map

---

## Test Suite 3: Route Planning

### Test 3.1: Open Route Selector
1. Login to application
2. Click "Route Planner" button (🗺️) in header
3. **Expected**: Route selector modal opens

### Test 3.2: Use Current Location
1. Open route selector
2. Click "Use Current Location" button (📍)
3. **Expected**:
   - Start location fields auto-filled
   - Address shows "Current Location"
   - Coordinates populated

### Test 3.3: Enter Destination
1. In route selector, enter destination:
   - Address: "MG Road, Bengaluru"
   - Lat: 12.9350
   - Lng: 77.6200
2. **Expected**: Fields accept input

### Test 3.4: Calculate Routes
1. Enter start and destination
2. Click "Calculate Routes"
3. **Expected**:
   - Loading spinner appears
   - 3 route cards appear:
     - Safest Route (green border)
     - Balanced Route (blue border)
     - Fast Route (orange border)
   - Each shows distance, time, safety score

### Test 3.5: Compare Routes
1. After calculating routes, review each card
2. **Expected**:
   - Safest: Highest safety score (85-100)
   - Balanced: Medium safety score (70-85)
   - Fast: Lower safety score (50-70)
   - Issue counts vary
   - Recommendations shown

### Test 3.6: Select Route
1. Click on "Safest Route" card
2. **Expected**:
   - Card highlights with blue border
   - Checkmark appears
   - "Start Navigation" button activates

### Test 3.7: Start Navigation
1. Select a route
2. Click "Start Navigation"
3. **Expected**:
   - Modal closes
   - Route displays on map (green line)
   - Safety indicators along route
   - Route stats panel appears (right side)
   - Destination marker visible

### Test 3.8: Route Visualization
1. After starting navigation, check map
2. **Expected**:
   - Route line color matches type (green/blue/orange)
   - Small circles along route (safety indicators)
   - Circle colors: green (safe), yellow (moderate), red (risky)
   - Route stats show:
     - Distance
     - Time
     - Safety score
     - Rating

### Test 3.9: Toggle Route Mode
1. With route displayed, click "Fast Route" toggle
2. **Expected**:
   - Route recalculates
   - Line color changes to blue
   - Stats update

### Test 3.10: Clear Route
1. Click "Clear" button in route panel
2. **Expected**:
   - Route line disappears
   - Destination marker removed
   - Stats panel clears
   - Safety indicators removed

---

## Test Suite 4: Map Interactions

### Test 4.1: View Reports
1. Login and view map
2. Click on various colored markers
3. **Expected**:
   - Popup shows report details
   - Category, description, status visible
   - Estimated fix date (if available)

### Test 4.2: User Location
1. Click "My Location" FAB (blue, top right)
2. **Expected**:
   - Browser asks for location permission
   - Map centers on your location
   - Blue marker appears
   - Search radius circle visible

### Test 4.3: Set Destination by Click
1. Get user location first
2. Click anywhere on map
3. **Expected**:
   - Destination marker (🎯) appears
   - Route control panel shows "Destination set"
   - Calculate button available

### Test 4.4: Safety Heatmap
1. Get user location
2. Click "Show Heatmap" in route panel
3. **Expected**:
   - Colored circles overlay map
   - Green = safe areas
   - Yellow = moderate risk
   - Red = high risk
   - Circles semi-transparent

### Test 4.5: Zoom & Pan
1. Use mouse wheel to zoom
2. Drag to pan
3. **Expected**:
   - Smooth zoom animation
   - Map tiles load
   - Markers scale appropriately

---

## Test Suite 5: Real-Time Features

### Test 5.1: Socket.io Connection
1. Open browser console
2. Login to application
3. **Expected**: Console shows "Socket connected" or similar

### Test 5.2: Real-Time Report Updates
1. Open two browser windows
2. Login in both
3. Submit report in window 1
4. **Expected**: Report appears in window 2 immediately

### Test 5.3: Notifications
1. Submit a critical report (score 9-10)
2. Check notifications button (🔔)
3. **Expected**:
   - Red dot appears on bell icon
   - Click to see notification
   - Message about critical report

### Test 5.4: Report Status Updates
1. Admin updates report status (use official dashboard)
2. **Expected**:
   - Marker color changes on map
   - Notification sent to user
   - Status visible in popup

---

## Test Suite 6: Viosa AI Chatbot

### Test 6.1: Open Chatbot
1. Click purple AI button (bottom right)
2. **Expected**: Chatbot modal opens

### Test 6.2: Ask About Safety
1. Type: "What's the safety situation near me?"
2. Send message
3. **Expected**:
   - Response about nearby reports
   - Safety recommendations
   - Issue counts

### Test 6.3: Ask About Routes
1. Type: "What's the safest route to MG Road?"
2. Send message
3. **Expected**:
   - Route suggestions
   - Safety scores
   - Alternative options

### Test 6.4: Close Chatbot
1. Click X button
2. **Expected**: Modal closes smoothly

---

## Test Suite 7: Responsive Design

### Test 7.1: Desktop View (1920x1080)
1. Open in full-screen desktop browser
2. **Expected**:
   - All panels visible
   - Proper spacing
   - No overflow
   - Readable text

### Test 7.2: Tablet View (768x1024)
1. Resize browser to tablet size
2. **Expected**:
   - Layout adjusts
   - Buttons remain accessible
   - Modals fit screen
   - Touch targets adequate

### Test 7.3: Mobile View (375x667)
1. Open in mobile browser or resize
2. **Expected**:
   - Full-screen map
   - Bottom navigation visible
   - FABs accessible
   - Modals full-screen
   - Text readable

---

## Test Suite 8: Error Handling

### Test 8.1: Network Error
1. Disconnect internet
2. Try submitting report
3. **Expected**: Error message shown

### Test 8.2: Invalid Photo
1. Try uploading 20MB photo
2. **Expected**: Size limit error

### Test 8.3: Invalid Coordinates
1. Enter invalid lat/lng (e.g., 999, 999)
2. Try calculating route
3. **Expected**: Validation error

### Test 8.4: Session Expiry
1. Wait for JWT to expire (7 days)
2. Try making request
3. **Expected**: Redirect to login

---

## Test Suite 9: Performance

### Test 9.1: Map Load Time
1. Clear cache
2. Load application
3. **Expected**: Map loads within 2-3 seconds

### Test 9.2: Route Calculation Speed
1. Calculate route with 100+ reports
2. **Expected**: Results within 1-2 seconds

### Test 9.3: Photo Upload Speed
1. Upload 5MB photo
2. **Expected**: Upload completes within 3-5 seconds

### Test 9.4: Marker Rendering
1. Load map with 500+ markers
2. **Expected**: Smooth rendering, no lag

---

## Test Suite 10: Data Persistence

### Test 10.1: Report Persistence
1. Submit report
2. Refresh page
3. **Expected**: Report still visible on map

### Test 10.2: Login Persistence
1. Login
2. Close browser
3. Reopen application
4. **Expected**: Still logged in (token in localStorage)

### Test 10.3: Route Save (Future Feature)
1. Calculate route
2. Save route
3. Refresh page
4. **Expected**: Saved routes accessible

---

## Bug Report Template

If you find issues, report using this format:

```markdown
### Bug Report

**Title**: [Brief description]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots**:
[If applicable]

**Environment**:
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

**Console Errors**:
[Any errors from browser console]
```

---

## Performance Benchmarks

### Target Metrics
- **Page Load**: < 3 seconds
- **Route Calculation**: < 2 seconds
- **Photo Upload**: < 5 seconds (5MB)
- **Map Interaction**: 60 FPS
- **API Response**: < 500ms

### Monitoring Tools
- Chrome DevTools Performance tab
- Network tab for API calls
- Lighthouse for overall score
- React DevTools for component rendering

---

## Automated Testing (Future)

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

---

## Test Checklist Summary

### Authentication ✅
- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes work
- [ ] Token persistence works

### Report Form ✅
- [ ] Form opens
- [ ] Photo upload works
- [ ] GPS extraction works
- [ ] Critical score slider works
- [ ] Form validation works
- [ ] Report submission works
- [ ] Report appears on map

### Route Planning ✅
- [ ] Route selector opens
- [ ] Current location works
- [ ] Route calculation works
- [ ] 3 routes displayed
- [ ] Route selection works
- [ ] Route visualization works
- [ ] Route stats display
- [ ] Toggle mode works
- [ ] Clear route works

### Map Features ✅
- [ ] Reports display correctly
- [ ] User location works
- [ ] Destination setting works
- [ ] Heatmap works
- [ ] Zoom/pan works
- [ ] Markers clickable
- [ ] Popups show details

### Real-Time ✅
- [ ] Socket.io connects
- [ ] Real-time updates work
- [ ] Notifications work
- [ ] Status updates work

### UI/UX ✅
- [ ] Responsive on desktop
- [ ] Responsive on tablet
- [ ] Responsive on mobile
- [ ] Animations smooth
- [ ] Colors correct
- [ ] Typography readable

### Performance ✅
- [ ] Fast load times
- [ ] Smooth interactions
- [ ] No memory leaks
- [ ] Efficient rendering

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend is running
3. Check database connection
4. Review environment variables
5. Clear cache and try again

For help, refer to:
- `FRONTEND_INTEGRATION_COMPLETE.md`
- `USER_INTERFACE_GUIDE.md`
- `FRONTEND_COMPLETE_GUIDE.md`

---

Happy Testing! 🧪✨

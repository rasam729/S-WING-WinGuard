# Testing Real-Time Notification System 🔔

## Prerequisites

Before testing, ensure all services are running:

### 1. Start Backend Server
```bash
cd server
npm run dev
```
**Expected Output:**
```
✓ Database connected
✓ Server running on port 3000
✓ Environment: development
✓ WebSocket server ready
```

### 2. Start Citizen App
```bash
cd apps/citizen-app
npm run dev
```
**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 3. Start Official Dashboard
```bash
cd apps/official-dashboard
npm run dev
```
**Expected Output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5174/
```

---

## Test Scenario 1: Complete Notification Flow

### Step 1: Login as Citizen
1. Open browser: `http://localhost:5173`
2. Login with:
   - Email: `test@example.com`
   - Password: `password123`
3. **Allow browser notifications** when prompted (IMPORTANT!)

### Step 2: Submit a Report
1. Click on **Map** tab (bottom navigation)
2. Click **"Get My Location"** button
3. Fill in the report form:
   - **Category**: Pothole
   - **Severity**: 8
   - **Description**: "Large pothole on MG Road near Forum Mall"
4. Take/upload a photo (optional)
5. Click **"Submit Report"**
6. **Expected Result**: 
   - ✅ Success message appears
   - ✅ Report appears on map as a marker
   - ✅ Report ID is shown

### Step 3: Check Stats Page
1. Click on **Stats** tab (bottom navigation)
2. **Expected Result**:
   - ✅ Total Reports count increased by 1
   - ✅ Recent Activity shows "Report Submitted 📋"
   - ✅ Activity has yellow/orange pending badge

### Step 4: Login as Official
1. Open **NEW BROWSER TAB** (keep citizen tab open!)
2. Navigate to: `http://localhost:5174`
3. Login with:
   - Email: `official@bengaluru.gov.in`
   - Password: `official123`

### Step 5: View Report in Official Dashboard
1. Click on **Issues** in sidebar
2. **Expected Result**:
   - ✅ Your submitted report appears in the list
   - ✅ Shows category, severity, description
   - ✅ Shows photo if uploaded
   - ✅ "Mark as Resolved" button is visible

### Step 6: Resolve the Report
1. Click **"Mark as Resolved"** button
2. **Expected Result**:
   - ✅ Button shows "Resolving..." with spinner
   - ✅ Success alert appears:
     ```
     ✅ Report marked as resolved!
     
     📢 Citizen has been notified via:
     • Browser notification
     • In-app alert
     • Stats page update
     
     The report will disappear from the map.
     ```
   - ✅ Report card gets green border
   - ✅ Button changes to "Already Resolved"

### Step 7: Check Citizen Notifications (SWITCH TO CITIZEN TAB)
1. Switch back to citizen app tab (`http://localhost:5173`)
2. **Expected Results** (should happen automatically):
   
   **A. Browser Notification:**
   - ✅ Desktop notification appears (top-right corner)
   - Title: "Issue Resolved! ✅"
   - Body: "Your Pothole report has been fixed!"
   - Icon: WinGuard logo
   
   **B. In-App Alert:**
   - ✅ Alert popup appears:
     ```
     ✅ Great news! Your Pothole report has been resolved by officials!
     ```
   
   **C. Notification Panel:**
   - ✅ Notification panel opens automatically
   - ✅ Shows green success notification
   - ✅ Message: "Great news! The Pothole issue you reported has been resolved..."
   
   **D. Map Updates:**
   - ✅ Report marker disappears from map
   - ✅ Only active (unresolved) reports remain visible

### Step 8: Check Stats Page Resolution History
1. Click on **Stats** tab in citizen app
2. **Expected Results**:
   - ✅ Resolved Reports count increased by 1
   - ✅ Recent Activity shows TWO entries:
     1. "Report Submitted 📋" (older)
     2. "Issue Resolved ✅" (newer) with **GREEN GRADIENT BADGE** saying "FIXED"
   - ✅ Resolution entry has green check icon (filled)
   - ✅ Description: "Great news! The Pothole issue has been fixed by officials. Thank you for making your community safer!"
   - ✅ Timestamp shows relative time (e.g., "Just now", "2 minutes ago")

---

## Test Scenario 2: Multiple Reports

### Test Multiple Notifications
1. Submit 3 different reports as citizen:
   - Pothole (severity 8)
   - Broken Streetlight (severity 6)
   - Road Crack (severity 7)
2. As official, resolve them one by one
3. **Expected**: Each resolution triggers separate notification

---

## Test Scenario 3: Browser Notification Permissions

### If Notifications Don't Appear:

#### Chrome/Edge:
1. Click **lock icon** in address bar
2. Click **Site settings**
3. Find **Notifications**
4. Change to **Allow**
5. Refresh page

#### Firefox:
1. Click **shield icon** in address bar
2. Click **Connection secure** > **More information**
3. Go to **Permissions** tab
4. Find **Receive Notifications**
5. Uncheck "Use default" and select **Allow**
6. Refresh page

#### Check if blocked:
```javascript
// Open browser console (F12) and run:
console.log(Notification.permission);
// Should show: "granted"
// If shows "denied", follow steps above
```

---

## Test Scenario 4: WebSocket Connection

### Verify WebSocket is Working:

#### In Citizen App Console (F12):
```javascript
// You should see these logs:
📡 Broadcasted report-resolved event for report: 123
🎉 Report resolved: {reportId: 123, category: "Pothole", ...}
📬 New notification: {...}
```

#### In Backend Terminal:
```
📡 Broadcasted new-report and new-notification for report: 123
📡 Broadcasted report-resolved event for report: 123
```

---

## Troubleshooting

### Issue: No Browser Notification
**Solution:**
1. Check notification permission (see above)
2. Verify browser supports notifications
3. Check browser console for errors
4. Try in incognito/private mode

### Issue: No In-App Alert
**Solution:**
1. Check browser console for WebSocket errors
2. Verify backend is running on port 3000
3. Check CORS settings in `server/src/server.ts`
4. Restart both frontend and backend

### Issue: Map Doesn't Update
**Solution:**
1. Hard refresh page (Ctrl+Shift+R)
2. Check WebSocket connection in Network tab
3. Verify `fetchReports()` is called after event

### Issue: Stats Page Doesn't Show Resolution
**Solution:**
1. Check if `resolved_at` column exists in database
2. Verify API returns `resolved_at` timestamp
3. Check browser console for API errors
4. Refresh stats page manually

### Issue: WebSocket Not Connecting
**Solution:**
1. Check if backend is running
2. Verify port 3000 is not blocked by firewall
3. Check browser console for connection errors:
   ```
   Failed to connect to ws://localhost:3000
   ```
4. Restart backend server

---

## Expected Console Logs

### Citizen App Console (when report is resolved):
```
🎉 Report resolved: {reportId: 45, userId: 12, category: "Pothole", message: "..."}
📬 New notification: {notification: {...}, userId: 12}
Report status changed: {reportId: 45, status: "Resolved", userId: 12}
```

### Backend Console (when official resolves):
```
📡 Broadcasted report-resolved event for report: 45
```

---

## Success Criteria Checklist

After completing all tests, verify:

- [ ] Browser notification appears on desktop
- [ ] In-app alert shows success message
- [ ] Notification panel opens automatically
- [ ] Resolved report disappears from map
- [ ] Stats page shows resolution with green "FIXED" badge
- [ ] Resolution timestamp is accurate
- [ ] Multiple reports can be resolved independently
- [ ] No duplicate notifications
- [ ] WebSocket connection is stable
- [ ] All three notification channels work (browser, alert, panel)

---

## Performance Testing

### Test with Multiple Users:
1. Open 3 citizen tabs (different users)
2. Each submits a report
3. Resolve all reports as official
4. **Expected**: Each citizen receives only their own notification

### Test Rapid Resolution:
1. Submit 5 reports quickly
2. Resolve all 5 rapidly
3. **Expected**: All notifications arrive without delay or loss

---

## Database Verification

### Check Notifications Table:
```sql
SELECT * FROM notifications 
WHERE type = 'success' 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Check Resolved Reports:
```sql
SELECT report_id, category, status, resolved_at, resolved_by 
FROM reports 
WHERE status = 'Resolved' 
ORDER BY resolved_at DESC;
```

---

## Video Recording Suggestion

Record your screen while testing to capture:
1. Report submission
2. Official resolving
3. Browser notification appearing
4. In-app alert showing
5. Map updating
6. Stats page showing green badge

This helps verify all features work correctly!

---

## Need Help?

If any test fails:
1. Check all services are running
2. Review browser console for errors
3. Check backend terminal for errors
4. Verify database connection
5. Restart all services and try again

**Good luck testing! 🚀**

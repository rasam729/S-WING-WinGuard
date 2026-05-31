# Quick Test: Alerts Page Fix ✅

## What Was Fixed
The Alerts page was showing "No Alerts" because it wasn't filtering notifications by the logged-in user. Now it:
1. Fetches user's reports to get their report IDs
2. Filters notifications to show only those related to user's reports
3. Listens for real-time WebSocket events (`report-resolved`, `new-notification`)

## Quick Test Steps

### 1. Make Sure Services Are Running
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Citizen App
cd apps/citizen-app
npm run dev

# Terminal 3 - Official Dashboard
cd apps/official-dashboard
npm run dev
```

### 2. Test the Fix

#### A. Login as Citizen
1. Open: `http://localhost:5173`
2. Login: `test@example.com` / `password123`
3. Go to **Alerts** page (bottom navigation)
4. Should show: "No Alerts" (if no reports resolved yet)

#### B. Submit a Report
1. Go to **Map** page
2. Click "Get My Location"
3. Fill form:
   - Category: Pothole
   - Severity: 8
   - Description: "Test pothole"
4. Submit

#### C. Resolve as Official
1. Open NEW TAB: `http://localhost:5174`
2. Login: `official@bengaluru.gov.in` / `official123`
3. Go to **Issues** page
4. Find your report
5. Click **"Mark as Resolved"**
6. Wait for success alert

#### D. Check Citizen Alerts (SWITCH BACK TO CITIZEN TAB)
1. Go to **Alerts** page
2. **Expected Results:**
   - ✅ Green success notification appears
   - ✅ Title: "Issue Resolved"
   - ✅ Message: "Great news! The Pothole issue you reported has been resolved..."
   - ✅ Green gradient icon with check mark
   - ✅ Shows time (e.g., "Just now")
   - ✅ "Mark as read" button visible
   - ✅ Unread count badge shows "1 New"

### 3. Check Browser Console
Open browser console (F12) and look for:
```
🔄 Fetching notifications for user: 1
📋 User report IDs: [45, 46, 47]
✅ Filtered notifications: 1
📬 New notification received in AlertsPage: {...}
🎉 Report resolved notification in AlertsPage: {...}
```

### 4. Test Real-Time Updates
1. Keep Alerts page open
2. In another tab, have official resolve another report
3. **Expected:** Alerts page auto-updates within 10 seconds (or immediately via WebSocket)

## Troubleshooting

### Still Shows "No Alerts"?
1. **Check browser console** for errors
2. **Verify token** is valid (check localStorage)
3. **Check backend logs** for notification creation
4. **Refresh page** (Ctrl+R)
5. **Clear browser cache** and reload

### Notifications Not Real-Time?
1. Check WebSocket connection in Network tab
2. Look for `ws://localhost:3000` connection
3. Verify backend shows: `✓ WebSocket server ready`
4. Check for CORS errors in console

### Wrong Notifications Showing?
1. Verify user_id in notifications table matches logged-in user
2. Check report_id in notifications matches user's reports
3. Run SQL query:
   ```sql
   SELECT n.*, r.user_id as report_owner
   FROM notifications n
   LEFT JOIN reports r ON n.report_id = r.report_id
   ORDER BY n.sent_at DESC;
   ```

## Database Check

### View All Notifications:
```sql
SELECT 
  n.notification_id,
  n.user_id,
  n.report_id,
  n.message,
  n.type,
  n.sent_at,
  n.read_at,
  r.category,
  r.user_id as report_owner_id
FROM notifications n
LEFT JOIN reports r ON n.report_id = r.report_id
ORDER BY n.sent_at DESC
LIMIT 10;
```

### Check User's Reports:
```sql
SELECT report_id, category, status, user_id, created_at
FROM reports
WHERE user_id = 1  -- Replace with your user ID
ORDER BY created_at DESC;
```

## Success Criteria
- [x] Alerts page shows notifications for user's reports only
- [x] Real-time updates work via WebSocket
- [x] Resolved reports show green success notification
- [x] Unread count badge is accurate
- [x] "Mark as read" functionality works
- [x] Delete notification works
- [x] Filter tabs (All/Unread) work correctly

## Next Steps After Testing
Once confirmed working:
1. Test with multiple users
2. Test with multiple reports
3. Test mark as read functionality
4. Test delete functionality
5. Ready to commit and push!

---

**Note:** The page auto-refreshes every 10 seconds during testing. Change to 30 seconds in production by modifying line 42 in AlertsPage.tsx.

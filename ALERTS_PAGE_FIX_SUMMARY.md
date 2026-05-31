# Alerts Page Fix Summary 🔔

## Problem
The Alerts page was showing "No Alerts" even after officials resolved citizen reports because:
1. The page wasn't filtering notifications by the logged-in user
2. It was fetching ALL notifications from the database
3. No authentication was being used to filter user-specific notifications

## Solution Implemented

### Changes Made to `apps/citizen-app/src/pages/AlertsPage.tsx`:

#### 1. Added Authentication
```typescript
import { useAuth } from '../contexts/AuthContext';

const { token, user } = useAuth();
```

#### 2. Enhanced Notification Fetching
```typescript
const fetchNotifications = async () => {
  // Step 1: Fetch user's reports to get their report IDs
  const reportsResponse = await fetch('http://localhost:3000/api/reports', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const reportsData = await reportsResponse.json();
  const userReportIds = reportsData.data.reports.map((r: any) => r.report_id);
  
  // Step 2: Fetch all notifications
  const notificationsResponse = await fetch('http://localhost:3000/api/notifications');
  const notificationsData = await notificationsResponse.json();
  
  // Step 3: Filter to show only user's notifications
  const userNotifications = notificationsData.data.filter((notif: Alert) => 
    notif.user_id === user?.userId || 
    (notif.report_id && userReportIds.includes(notif.report_id))
  );
  
  setAlerts(userNotifications);
};
```

#### 3. Added Real-Time WebSocket Listeners
```typescript
socket.on('new-notification', (data) => {
  console.log('📬 New notification received');
  fetchNotifications();
});

socket.on('report-resolved', (data) => {
  console.log('🎉 Report resolved notification');
  fetchNotifications();
});

socket.on('report-status-changed', (data) => {
  console.log('📊 Report status changed');
  fetchNotifications();
});
```

#### 4. Faster Refresh for Testing
Changed auto-refresh interval from 30 seconds to 10 seconds for easier testing:
```typescript
const interval = setInterval(fetchNotifications, 10000); // 10 seconds
```

## How It Works Now

### Flow Diagram:
```
1. User logs in → AuthContext stores user.userId
                              ↓
2. AlertsPage loads → Fetches user's reports using token
                              ↓
3. Gets report IDs → [45, 46, 47]
                              ↓
4. Fetches all notifications from database
                              ↓
5. Filters notifications where:
   - notification.user_id === user.userId OR
   - notification.report_id is in user's report IDs
                              ↓
6. Displays filtered notifications
                              ↓
7. Listens for WebSocket events:
   - new-notification
   - report-resolved
   - report-status-changed
                              ↓
8. Auto-refreshes when events received
```

## Expected Behavior

### When Official Resolves Report:
1. Backend creates notification with user_id and report_id
2. Backend emits WebSocket event: `report-resolved`
3. Citizen's AlertsPage receives event
4. AlertsPage fetches notifications
5. Filters to show only citizen's notifications
6. Displays green success notification:
   - Title: "Issue Resolved"
   - Message: "Great news! The Pothole issue you reported has been resolved..."
   - Icon: Green check circle
   - Badge: "1 New" (if unread)

### Notification Display:
```
┌─────────────────────────────────────────────┐
│ ✅ Issue Resolved                    ● NEW  │
│                                             │
│ Great news! The Pothole issue you          │
│ reported has been resolved. Thank you      │
│ for helping make your community safer!     │
│                                             │
│ 🕐 Just now                                 │
│                                             │
│ [Mark as read]  [🗑️]                       │
└─────────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Login as citizen
- [ ] Submit a report
- [ ] Login as official (new tab)
- [ ] Resolve the report
- [ ] Switch back to citizen tab
- [ ] Go to Alerts page
- [ ] Verify notification appears
- [ ] Check "1 New" badge
- [ ] Click "Mark as read"
- [ ] Verify badge updates
- [ ] Test delete notification
- [ ] Test filter tabs (All/Unread)

## Console Logs to Verify

### Citizen App Console:
```
🔄 Fetching notifications for user: 1
📋 User report IDs: [45, 46, 47]
✅ Filtered notifications: 1
📬 New notification received in AlertsPage: {...}
🎉 Report resolved notification in AlertsPage: {...}
```

### Backend Console:
```
📡 Broadcasted report-resolved event for report: 45
📡 Broadcasted new-notification for notification: 123
```

## Database Verification

### Check Notifications Table:
```sql
SELECT 
  n.notification_id,
  n.user_id,
  n.report_id,
  n.message,
  n.type,
  n.sent_at,
  r.user_id as report_owner_id,
  r.category
FROM notifications n
LEFT JOIN reports r ON n.report_id = r.report_id
WHERE r.user_id = 1  -- Your user ID
ORDER BY n.sent_at DESC;
```

Expected result:
```
notification_id | user_id | report_id | type    | message
----------------|---------|-----------|---------|------------------
123             | 1       | 45        | success | Great news! The Pothole...
```

## Files Modified

1. **apps/citizen-app/src/pages/AlertsPage.tsx**
   - Added authentication import
   - Enhanced fetchNotifications with filtering
   - Added WebSocket listeners for real-time updates
   - Improved console logging for debugging

## Performance Considerations

- Auto-refresh every 10 seconds (testing) / 30 seconds (production)
- WebSocket provides instant updates (no polling delay)
- Filters notifications client-side (could be optimized with server-side filtering)

## Future Improvements

1. **Server-Side Filtering**: Add user_id parameter to `/api/notifications` endpoint
2. **Pagination**: Load notifications in batches for better performance
3. **Notification Categories**: Group by type (resolved, in-progress, critical)
4. **Sound Alerts**: Play sound when new notification arrives
5. **Push Notifications**: Implement service worker for background notifications

## Troubleshooting

### Issue: Still shows "No Alerts"
**Possible Causes:**
1. User has no reports
2. No reports have been resolved
3. Token is invalid/expired
4. Backend not running
5. Database connection issue

**Solutions:**
1. Submit a test report
2. Have official resolve it
3. Check localStorage for valid token
4. Verify backend is running on port 3000
5. Check PostgreSQL connection

### Issue: Notifications not real-time
**Possible Causes:**
1. WebSocket not connecting
2. CORS blocking WebSocket
3. Backend not emitting events

**Solutions:**
1. Check Network tab for WebSocket connection
2. Verify CORS settings in server.ts
3. Check backend console for emit logs

## Success Criteria

✅ Alerts page shows user-specific notifications only
✅ Real-time updates via WebSocket
✅ Green success notification for resolved reports
✅ Accurate unread count badge
✅ Mark as read functionality works
✅ Delete notification works
✅ Filter tabs work correctly
✅ Auto-refresh every 10 seconds
✅ Console logs show proper filtering

## Ready to Test!

Follow the steps in `QUICK_TEST_ALERTS.md` to verify everything works correctly.

---

**Last Updated:** May 30, 2026
**Status:** ✅ Ready for Testing

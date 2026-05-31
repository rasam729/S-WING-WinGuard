# WinGuard Enhancement Implementation Plan

## Features to Implement

### 1. Real-Time Notifications System ✅
**Citizen → Official Alert (New Report)**
- Use WebSocket (Socket.io already configured)
- When citizen submits report, emit event to all connected officials
- Show browser notification + in-app notification

**Official → Citizen Alert (Report Resolved)**
- When official marks report as resolved, emit event to report creator
- Update citizen's stats page automatically
- Show notification: "Your report #123 has been resolved!"

### 2. Fix Login Error ✅
**Issue:** You're using wrong email
- **Current:** siriydeepak32@gmail.com
- **Correct:** official@bengaluru.gov.in
- **Password:** official123

### 3. Reports on Map ✅
- Fetch all unresolved reports from `/api/reports/all`
- Plot markers at exact lat/lng from database
- Color code by severity (red=critical, orange=high, yellow=medium)
- Click marker to see report details
- Auto-remove marker when status changes to "Resolved"

### 4. Fix Distance Calculation ✅
**Current Issue:** Showing 25km for 5km route
**Solution:** Use proper Haversine formula or Google Maps Distance Matrix API

**Haversine Formula (Free, Accurate):**
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
```

### 5. Citizen Stats History ✅
- Add "resolved_at" timestamp to reports table
- Show resolved reports in stats with green checkmark
- Display resolution time (e.g., "Resolved in 2 days")

---

## Quick Implementation Steps

### Step 1: WebSocket Notifications (Backend)
File: `server/src/routes/reportsPostgres.ts`

```typescript
// After creating report
io.emit('new-report', {
  reportId: report.report_id,
  category: report.category,
  severity: report.severity,
  location: { lat, lng }
});

// After resolving report
io.to(`user-${userId}`).emit('report-resolved', {
  reportId,
  category,
  resolvedAt: new Date()
});
```

### Step 2: Frontend Listeners (Citizen App)
File: `apps/citizen-app/src/pages/StatsPage.tsx`

```typescript
useEffect(() => {
  const socket = io('http://localhost:3000');
  
  socket.on('report-resolved', (data) => {
    // Show notification
    new Notification('Report Resolved!', {
      body: `Your ${data.category} report has been fixed!`
    });
    
    // Refresh stats
    fetchUserStats();
  });
  
  return () => socket.disconnect();
}, []);
```

### Step 3: Map Integration (Official Dashboard)
File: `apps/official-dashboard/src/pages/DashboardPage.tsx`

```typescript
// Fetch and display reports on map
const reports = await fetch('http://localhost:3000/api/reports/all');
reports.forEach(report => {
  if (report.status !== 'Resolved') {
    addMarker(report.latitude, report.longitude, report);
  }
});

// Listen for resolved reports
socket.on('report-resolved', ({ reportId }) => {
  removeMarker(reportId);
});
```

### Step 4: Fix Distance Calculator
File: `apps/citizen-app/src/utils/safeRouteCalculator.ts`

Replace current distance calculation with Haversine formula above.

---

## Testing Checklist

- [ ] Citizen submits report → Official sees notification
- [ ] Official resolves report → Citizen sees notification
- [ ] Report appears on map at correct location
- [ ] Report disappears from map when resolved
- [ ] Distance calculation shows accurate km
- [ ] Stats page shows resolved reports in history

---

## Database Changes Needed

```sql
-- Add resolved_at column
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES users(user_id);

-- Update when resolving
UPDATE reports 
SET status = 'Resolved', 
    resolved_at = CURRENT_TIMESTAMP,
    resolved_by = $1
WHERE report_id = $2;
```

---

## Files to Modify

1. `server/src/routes/reportsPostgres.ts` - Add WebSocket emits
2. `apps/citizen-app/src/pages/StatsPage.tsx` - Add socket listener
3. `apps/official-dashboard/src/pages/DashboardPage.tsx` - Add map markers
4. `apps/official-dashboard/src/pages/ReportsPage.tsx` - Add resolve button
5. `apps/citizen-app/src/utils/safeRouteCalculator.ts` - Fix distance calc

---

## Priority Order

1. **Fix Login** - Use correct email (official@bengaluru.gov.in)
2. **Add Database Columns** - Run SQL above
3. **Implement WebSocket Notifications** - Real-time updates
4. **Add Map Markers** - Show reports on map
5. **Fix Distance Calculator** - Accurate routing
6. **Update Stats Page** - Show resolution history

---

## Estimated Time: 2-3 hours
## Credits Used: Minimal (mostly planning)

**Next Steps:** Would you like me to implement these one by one, or would you prefer to do it yourself using this guide?

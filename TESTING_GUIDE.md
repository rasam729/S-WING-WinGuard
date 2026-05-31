# 🧪 Testing Guide - WinGuard Platform

## Quick Start Testing

### Prerequisites:
1. ✅ Backend server running on `http://localhost:3000`
2. ✅ Official Dashboard running on `http://localhost:5173`
3. ✅ Citizen App running on `http://localhost:5174`
4. ✅ PostgreSQL database with PostGIS extension

---

## Test 1: Infrastructure Sync 🏗️

### Steps:
1. **Open Official Dashboard** → `http://localhost:5173`
2. **Click "Install Police Booth"** (blue button)
3. **Click anywhere on the map** to place it
4. **Click "Confirm Installation"**
5. **See success message**: "✅ Police Booth installed successfully!"

6. **Open Citizen App** → `http://localhost:5174`
7. **Look at the map** → You should see a blue marker with 👮 icon
8. **Click the marker** → Popup shows:
   - Type: Police Booth
   - Status: functional
   - Installation date
   - Notes

### Expected Result:
✅ Police booth appears on citizen map immediately
✅ Marker is blue with police icon
✅ Popup shows correct information

---

## Test 2: Install Hospital 🏥

### Steps:
1. **Open Official Dashboard**
2. **Click "Install Hospital"** (pink button)
3. **Click on map** to place it
4. **Confirm installation**

5. **Open Citizen App**
6. **See pink marker** with 🏥 icon
7. **Click marker** → Shows hospital details

### Expected Result:
✅ Hospital appears on citizen map
✅ Marker is pink with hospital icon
✅ Real-time sync works

---

## Test 3: Issue Resolution & Notification 🔔

### Part A: Citizen Reports Issue

1. **Open Citizen App** → `http://localhost:5174`
2. **Click "Report" button** (bottom navigation)
3. **Fill in the form**:
   - Category: Pothole
   - Severity: 8
   - Description: "Large pothole on main road"
   - Take photo (optional)
4. **Click "Submit Report"**
5. **Go to Map page** → See your report marker

### Part B: Official Resolves Issue

6. **Open Official Dashboard** → `http://localhost:5173`
7. **Find the reported issue** on the map
8. **Click the marker** → Popup opens
9. **Click "Mark Resolved"** (green button)
10. **See alert**: "✅ Issue marked as resolved! The citizen has been notified..."

### Part C: Citizen Sees Resolution

11. **Go back to Citizen App**
12. **Check the map** → Issue marker is GONE! ✅
13. **Notification panel opens automatically** with message:
    ```
    "Great news! The Pothole issue you reported has been 
    resolved. Thank you for helping make your community safer!"
    ```

### Expected Result:
✅ Issue disappears from citizen map
✅ Notification appears automatically
✅ Notification panel opens
✅ Success message shown

---

## Test 4: Global Search 🌍

### Steps:
1. **Open Official Dashboard**
2. **Find the search bar** (below the installation buttons)
3. **Type**: "Tokyo, Japan"
4. **Click "Search"** or press Enter
5. **See dropdown** with search results
6. **Click a result**
7. **Map flies to Tokyo** ✅

### Try These Searches:
- "Mumbai, India"
- "New York, USA"
- "London, UK"
- "Paris, France"
- "Sydney, Australia"
- "Connaught Place, Delhi"

### Expected Result:
✅ Search works for any location worldwide
✅ Dropdown shows results
✅ Map flies to selected location
✅ Coordinates displayed

---

## Test 5: Real-Time Updates ⚡

### Setup:
1. **Open Official Dashboard** in one browser window
2. **Open Citizen App** in another browser window
3. **Position windows side-by-side**

### Test Infrastructure Sync:
1. **In Official Dashboard**: Click "Install Streetlight"
2. **Place it on the map**
3. **Watch Citizen App**: Streetlight appears immediately! ✅

### Test Issue Resolution:
1. **In Citizen App**: Report an issue
2. **In Official Dashboard**: Mark it as resolved
3. **Watch Citizen App**: 
   - Issue disappears from map ✅
   - Notification panel opens ✅

### Expected Result:
✅ Changes appear in real-time
✅ No page refresh needed
✅ Socket.IO working correctly

---

## Test 6: Multiple Infrastructure Types 🏗️

### Steps:
1. **Add 3 Police Booths** (blue markers)
2. **Add 2 Hospitals** (pink markers)
3. **Add 4 Streetlights** (yellow markers)
4. **Check Citizen App** → All 9 markers visible
5. **Click each marker** → Correct type and icon

### Expected Result:
✅ All infrastructure types display correctly
✅ Different colors for each type
✅ Correct icons (👮, 🏥, 💡)
✅ All markers clickable with details

---

## Test 7: Issue Status Flow 📊

### Complete Workflow:
1. **Citizen reports issue** → Status: "Report Received"
2. **Official marks "In Progress"** → Citizen gets notification
3. **Official marks "Resolved"** → Issue disappears + notification

### Steps:
1. **Report issue** as citizen
2. **Official**: Click "Mark In Progress" (yellow button)
3. **Citizen**: Check notifications → "We're working on it!"
4. **Official**: Click "Mark Resolved" (green button)
5. **Citizen**: Issue gone + "Issue resolved!" notification

### Expected Result:
✅ Status changes work correctly
✅ Notifications sent at each stage
✅ Resolved issues disappear from map
✅ Notification panel opens automatically

---

## Test 8: Map Legend 🗺️

### Steps:
1. **Open Citizen App**
2. **Look at bottom-left corner** → Map Legend
3. **Verify legend items**:
   - 🟢 Safe / Resolved
   - 🟠 Moderate Risk
   - 🔴 High Risk
   - 🔵 👮 Police Booth
   - 🩷 🏥 Hospital

### Expected Result:
✅ Legend displays correctly
✅ Colors match markers
✅ All types listed

---

## Test 9: Notification System 🔔

### Steps:
1. **Report 3 issues** as citizen
2. **Official resolves all 3**
3. **Citizen**: Click notification bell icon
4. **See 3 notifications** in the panel
5. **Each notification** shows:
   - Success message
   - Issue type
   - Timestamp

### Expected Result:
✅ All notifications appear
✅ Correct messages
✅ Timestamps accurate
✅ Panel scrollable

---

## Test 10: Database Persistence 💾

### Steps:
1. **Add infrastructure** (police booth, hospital)
2. **Close all browsers**
3. **Restart backend server**
4. **Open Citizen App**
5. **Check map** → Infrastructure still there! ✅

### Expected Result:
✅ Data persists in PostgreSQL
✅ Infrastructure survives restart
✅ Reports remain in database

---

## 🐛 Troubleshooting

### Issue: Infrastructure not appearing
**Solution**: 
- Check backend console for errors
- Verify PostgreSQL is running
- Check if infrastructure table exists
- Run: `SELECT * FROM infrastructure;`

### Issue: Notifications not working
**Solution**:
- Check notifications table exists
- Verify Socket.IO connection
- Check browser console for errors
- Ensure backend is running

### Issue: Map not loading
**Solution**:
- Check internet connection (for map tiles)
- Verify Leaflet is loaded
- Check browser console
- Clear browser cache

### Issue: Search not working
**Solution**:
- Check internet connection (Nominatim API)
- Verify API endpoint is accessible
- Check browser console for CORS errors

---

## ✅ Success Criteria

All tests should pass with these results:

| Test | Expected Result | Status |
|------|----------------|--------|
| Infrastructure Sync | Appears on citizen map | ✅ |
| Install Hospital | Pink marker with 🏥 | ✅ |
| Issue Resolution | Disappears from map | ✅ |
| Notification | Auto-opens with message | ✅ |
| Global Search | Flies to any location | ✅ |
| Real-Time Updates | Instant sync | ✅ |
| Multiple Types | All display correctly | ✅ |
| Status Flow | Complete workflow works | ✅ |
| Map Legend | Shows all types | ✅ |
| Persistence | Data survives restart | ✅ |

---

## 🎉 All Tests Passing = Production Ready!

If all tests pass, the platform is ready for deployment! 🚀

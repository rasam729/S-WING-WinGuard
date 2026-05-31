# 🔗 How to Access WinGuard Dashboards

## 📍 Official Dashboard (For Officials)

### URL:
```
http://localhost:5173
```

### Login Credentials:
- **Email**: `official@winguard.com`
- **Password**: `official123`

### What You Can Do:
1. ✅ View all citizen reports on the map
2. ✅ See broken streetlight reports
3. ✅ Mark issues as "In Progress" or "Resolved"
4. ✅ Install infrastructure (Police Booths, Streetlights, Hospitals)
5. ✅ Search any location globally
6. ✅ View analytics and statistics

---

## 📱 Citizen App (For Citizens)

### URL:
```
http://localhost:5174
```

### Login Credentials:
- **Email**: `citizen@winguard.com`
- **Password**: `citizen123`

### What You Can Do:
1. ✅ Report issues (Potholes, Broken Streetlights, etc.)
2. ✅ View all reports on the map
3. ✅ See infrastructure (Police Booths, Hospitals, Streetlights)
4. ✅ Receive notifications when issues are fixed
5. ✅ View submission history in Profile page
6. ✅ Track status of your reports (Pending/In Progress/Fixed)

---

## 🚀 How to Start the Servers

### 1. Start Backend Server:
```bash
cd server
npm run dev
```
**Expected Output**: `✓ Server running on port 3000`

### 2. Start Official Dashboard:
```bash
cd apps/official-dashboard
npm run dev
```
**Expected Output**: `Local: http://localhost:5173/`

### 3. Start Citizen App:
```bash
cd apps/citizen-app
npm run dev
```
**Expected Output**: `Local: http://localhost:5174/`

---

## 🧪 Testing the New Features

### Test 1: Report Broken Streetlight
1. **Open Citizen App**: `http://localhost:5174`
2. **Login** with citizen credentials
3. **Click "Report" button** (bottom navigation)
4. **Fill the form**:
   - Category: Select "Broken Streetlight"
   - Severity: 7
   - Description: "Streetlight not working on main road"
   - Take photo (optional)
5. **Submit Report**
6. **Go to Map** → See your report marker

### Test 2: Official Fixes the Issue
1. **Open Official Dashboard**: `http://localhost:5173`
2. **Login** with official credentials
3. **Find the broken streetlight report** on the map
4. **Click the marker** → Popup opens
5. **Click "Mark Resolved"** button
6. **See success alert**: "Issue marked as resolved! The citizen has been notified..."

### Test 3: Citizen Sees Fixed Status
1. **Go back to Citizen App**: `http://localhost:5174`
2. **Check the map** → Broken streetlight marker is GONE! ✅
3. **Click notification bell** → See "Issue resolved" notification ✅
4. **Go to Profile page** → Click "Profile" in bottom navigation
5. **Scroll to "Submission History"** section
6. **See your report** with status: "✅ Resolved" and "Fixed!" badge ✅

---

## 📊 Features Implemented

### ✅ Broken Streetlight Reports
- Citizens can report broken streetlights
- Reports appear on official dashboard
- Officials can mark as fixed
- Real-time sync between apps

### ✅ Fix Notifications
- When official marks issue as "Resolved"
- Citizen receives notification automatically
- Notification panel opens automatically
- Message: "Great news! The [Category] issue you reported has been resolved..."

### ✅ Submission History
- New section in Profile page
- Shows all reports submitted by citizen
- Displays status: Pending/In Progress/Resolved
- Shows "Fixed!" badge for resolved issues
- Includes date, severity, and description
- Shows photos if uploaded

### ✅ Real-Time Updates
- Socket.IO for instant sync
- No page refresh needed
- Resolved issues disappear from map
- Notifications appear automatically

---

## 🎨 UI Features

### Official Dashboard:
- **Map View**: All citizen reports with markers
- **Status Buttons**: 
  - 🟡 "Mark In Progress" (yellow)
  - 🟢 "Mark Resolved" (green)
- **Installation Buttons**:
  - 🔵 "Install Police Booth"
  - 💡 "Install Streetlight"
  - 🩷 "Install Hospital"
- **Global Search**: Search any location worldwide

### Citizen App:
- **Map View**: Active issues + infrastructure
- **Notification Panel**: Auto-opens for resolved issues
- **Profile Page**: 
  - Personal information
  - Settings
  - **Submission History** (NEW!)
- **Bottom Navigation**: Map, Report, Alerts, Stats, Profile

---

## 📱 Submission History Details

### What It Shows:
- **Report Category**: Pothole, Broken Streetlight, etc.
- **Description**: Full description of the issue
- **Status Badge**: 
  - ⏳ "Report Received" (red)
  - 🔄 "In Progress" (yellow)
  - ✅ "Resolved" (green)
- **Date & Time**: When report was submitted
- **Severity**: 1-10 scale
- **Photo**: If uploaded
- **Fixed Badge**: Shows "Fixed!" for resolved issues

### Example Display:
```
┌─────────────────────────────────────────┐
│ Broken Streetlight          ✅ Resolved │
│ Streetlight not working on main road    │
│                                          │
│ 📅 May 30, 2026, 10:30 AM               │
│ ⚠️ Severity: 7/10          ✅ Fixed!    │
└─────────────────────────────────────────┘
```

---

## 🔔 Notification System

### When Notifications Are Sent:
1. **Issue Marked "In Progress"**:
   - Message: "Good news! We're working on fixing the [Category] issue..."
   - Type: Info (blue)

2. **Issue Marked "Resolved"**:
   - Message: "Great news! The [Category] issue you reported has been resolved..."
   - Type: Success (green)
   - **Bonus**: Notification panel opens automatically!

### Where to See Notifications:
- **Notification Bell Icon**: Top-right corner
- **Auto-Open**: Panel opens when issue is resolved
- **Alerts Page**: Click "Alerts" in bottom navigation

---

## 🎯 Complete Workflow

### Citizen Reports → Official Fixes → Citizen Notified

```
1. Citizen reports broken streetlight
   ↓
2. Report appears on official dashboard
   ↓
3. Official clicks "Mark Resolved"
   ↓
4. System sends notification to citizen
   ↓
5. Issue disappears from citizen's map
   ↓
6. Notification panel opens automatically
   ↓
7. Report shows as "Fixed" in submission history
```

---

## 🚨 Troubleshooting

### Can't Access Official Dashboard?
- **Check**: Is backend server running? (`http://localhost:3000`)
- **Check**: Is official dashboard running? (`http://localhost:5173`)
- **Try**: Clear browser cache and refresh

### Reports Not Showing?
- **Check**: PostgreSQL database is running
- **Check**: Backend console for errors
- **Try**: Restart backend server

### Notifications Not Working?
- **Check**: Socket.IO connection (browser console)
- **Check**: Backend is emitting events
- **Try**: Refresh both apps

### Submission History Empty?
- **Check**: You're logged in as the correct user
- **Check**: You've submitted at least one report
- **Try**: Submit a test report and check again

---

## ✅ Success Checklist

- [ ] Backend server running on port 3000
- [ ] Official dashboard accessible at `http://localhost:5173`
- [ ] Citizen app accessible at `http://localhost:5174`
- [ ] Can login to both apps
- [ ] Can report broken streetlight
- [ ] Report appears on official dashboard
- [ ] Can mark issue as resolved
- [ ] Citizen receives notification
- [ ] Issue disappears from citizen map
- [ ] Submission history shows report as "Fixed"

---

## 🎉 You're All Set!

**Official Dashboard**: http://localhost:5173
**Citizen App**: http://localhost:5174

Happy testing! 🚀

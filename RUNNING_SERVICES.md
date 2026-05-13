# 🚀 WinGuard Services - Currently Running

## ✅ All Services Active

### 1. **Backend Server** 
- **Status:** ✅ Running
- **Port:** 3000
- **URL:** http://localhost:3000
- **API Endpoints:** 
  - http://localhost:3000/api/auth
  - http://localhost:3000/api/reports
  - http://localhost:3000/api/map

### 2. **Citizen Mobile App**
- **Status:** ✅ Running
- **Port:** 5176
- **Desktop URL:** http://localhost:5176
- **Mobile URL (Same WiFi):** http://172.26.80.1:5176
- **Features:**
  - 🗺️ Interactive map with hazards
  - 📍 Location search
  - 🧭 Safe route navigation
  - 🤖 Viosa AI assistant
  - 📱 Real-time GPS tracking

### 3. **Official Dashboard**
- **Status:** ✅ Running
- **Port:** 5177
- **Desktop URL:** http://localhost:5177
- **Mobile URL (Same WiFi):** http://172.26.80.1:5177
- **Features:**
  - 📊 Statistics dashboard
  - 📝 Reports management
  - 🗺️ City-wide hazard map
  - 👥 User management

---

## 📱 Access from Mobile Phone

### Requirements:
- ✅ Phone and computer on **same WiFi network**
- ✅ Firewall allows connections (Windows may prompt)

### URLs to Use on Phone:

#### Citizen App (Mobile):
```
http://172.26.80.1:5176
```

#### Official Dashboard:
```
http://172.26.80.1:5177
```

#### Backend API:
```
http://172.26.80.1:3000
```

---

## 🔐 Demo Credentials

### Citizen Account:
- **Email:** citizen@winguard.com
- **Password:** citizen123

### Official Account:
- **Email:** official@bengaluru.gov.in
- **Password:** official123

---

## 🧪 Testing Guide

### Test Citizen App:
1. Open `http://172.26.80.1:5176` on your phone
2. Login with citizen credentials
3. Test features:
   - ✅ Click "My Location" button
   - ✅ Search for a location (e.g., "MG Road")
   - ✅ Click Viosa AI button (purple bot icon in header)
   - ✅ Ask: "Show nearby hazards"
   - ✅ Enable GPS tracking (green button)
   - ✅ Click compass icon for navigation

### Test Official Dashboard:
1. Open `http://172.26.80.1:5177` on desktop/phone
2. Login with official credentials
3. View:
   - ✅ Statistics dashboard
   - ✅ All citizen reports
   - ✅ City-wide hazard map
   - ✅ Issue management

---

## 🛠️ Manage Services

### Check Status:
All services are running in background processes.

### Stop Services:
If you need to stop any service, let me know and I can stop them.

### Restart After Changes:
If you make code changes:
1. Services will auto-reload (Vite HMR)
2. Just refresh your browser

---

## 🔥 Firewall Notice

If you can't access from phone, Windows Firewall might be blocking:

### Allow Ports:
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Vite Dev Server 5176" -Direction Inbound -LocalPort 5176 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Vite Dev Server 5177" -Direction Inbound -LocalPort 5177 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Backend Server 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

Or when Windows prompts, click **Allow Access**.

---

## 📊 Service Health Check

### Backend Server:
```
http://localhost:3000/health
```
Should return: `{"status":"ok"}`

### Citizen App:
```
http://localhost:5176
```
Should show WinGuard login page

### Official Dashboard:
```
http://localhost:5177
```
Should show official login page

---

## 🎯 Quick Access Links

### Desktop:
- **Citizen App:** http://localhost:5176
- **Dashboard:** http://localhost:5177
- **Backend:** http://localhost:3000

### Mobile (Same WiFi):
- **Citizen App:** http://172.26.80.1:5176
- **Dashboard:** http://172.26.80.1:5177
- **Backend:** http://172.26.80.1:3000

---

## 💡 Tips

1. **Bookmark on Phone:**
   - Open citizen app URL on phone
   - Add to home screen for app-like experience

2. **Test GPS Features:**
   - Allow location access when prompted
   - GPS tracking works best outdoors

3. **Test Viosa AI:**
   - Click purple bot icon in header
   - Try: "Find safe route to 12.9716, 77.5946"
   - Try: "Show nearby hazards"
   - Try: "How to submit a report?"

4. **Network Issues:**
   - Ensure both devices on same WiFi
   - Check firewall settings
   - Try accessing from desktop first

---

**All services are ready! Start testing! 🚀**

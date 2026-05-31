# 🚀 WinGuard Quick Start Guide

Get WinGuard running on your local machine in **5 minutes**. This guide covers setup for both the **desktop dashboard** and **mobile citizen app** (PWA).

---

## ⚡ 5-Minute Setup

### **Step 1: Install Dependencies** (2 min)
cd Road_Safety/WinGuard

pm install

### **Step 2: Start Dev Servers** (1 min)

pm run dev

The command will launch:
- **Official Dashboard**: http://localhost:5178 (desktop browser)
- **Citizen App**: http://localhost:5179 (mobile/PWA)
- **Backend API**: http://localhost:3000

### **Step 3: Login**
Email:    admin@winguard.com
Password: admin123

### **Step 4: Access Apps**
- **Desktop**: Open http://localhost:5178 in your desktop browser
- **Mobile**: See  Mobile Access section below

---

## 📱 Mobile Access (PWA)

### **On Same Network (Recommended)**
1. Get your machine\s IP:
   Windows: ipconfig
   Mac/Linux: ifconfig
2. Find IPv4 Address (e.g., 192.168.x.x)
3. On mobile phone, visit: http://192.168.x.x:5179
4. **Install as PWA**:
   iOS Safari: Tap Share → Add to Home Screen
   Android Chrome: Tap Menu → \Install app\

### **PWA Features (Works Offline)**
- ✅ Service worker caching
- ✅ Offline map tiles
- ✅ Report drafts saved locally
- ✅ Background sync when online

---

## 🎯 Testing the Apps

### **Official Dashboard** (http://localhost:5178)

Dashboard Tab:
1. View global map with sample issues
2. Click \Install Streetlight\ or \Install Police Booth\
3. Click on map to place marker
4. Allocate budget using modal
5. See installation confirmed on map

Issues Tab:
1. View all reported issues
2. Click \Allocate Budget\ on any issue
3. Set amount, currency, timeline
4. Click \Resolve\ to mark as fixed

Analytics Tab:
1. View charts: Issues by road type (NH/SH/MDR)
2. See contractor breakdown
3. Check resolution metrics

Budget Tab:
1. View all budget allocations
2. See currency breakdown
3. Track spending by city/country

---

### **Citizen App** (http://localhost:5179)

Map Tab:
1. See all reported issues on map
2. Colors by status:
   - 🔴 Red = Critical
   - 🔵 Blue = In Progress
   - 🟢 Green = Resolved
3. Tap issue marker to see details
4. Road type displayed (NH/SH/MDR)

Report Issue:
1. Tap \+\ button to create report
2. Select issue category
3. Set severity
4. Add description ;& optional photo
5. Tap \Submit\

Navigation:
1. Tap \Start Navigation\
2. Choose safe route
3. Follow turn-by-turn directions

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | taskkill /PID <pid> /F (Windows) or lsof -ti :3000 \| xargs kill -9 (Mac/Linux) |
| Mobile won\	 connect | Ensure mobile on same WiFi, use machine IPv4 (not localhost) |
| Maps not loading | Check internet, OpenStreetMap CDN accessible |
| Login fails | Clear localStorage, check backend running |

---

**Happy Road Monitoring! 🛣️✨**

For more details, see README.md

# 📱 Mobile & Web Access Guide

## ✅ Services Running

### Backend Server
- **Status:** ✅ Running
- **Port:** 3000
- **URL:** http://localhost:3000

### Citizen App (Mobile)
- **Status:** ✅ Running with --host flag
- **Port:** 5173
- **Local URL:** http://localhost:5173
- **Mobile URL:** http://172.26.80.1:5173 ⭐
- **Alternative:** http://192.168.1.6:5173

### Official Dashboard (Web)
- **Status:** ✅ Running
- **Port:** 5176
- **URL:** http://localhost:5176 ⭐

---

## 📱 Access from Your Phone

### Step 1: Ensure Same WiFi
Make sure your phone is connected to the same WiFi network as your computer.

### Step 2: Open Browser on Phone
Open any browser (Chrome, Safari, etc.) on your phone.

### Step 3: Enter URL
Type in the address bar:
```
http://172.26.80.1:5173
```

### Step 4: Login
Use the demo credentials:
- **Email:** citizen@winguard.com
- **Password:** citizen123

---

## 💻 Access Dashboard from Computer

### Open Browser
Open any browser on your computer.

### Enter URL
```
http://localhost:5176
```

### Login
Use the official credentials:
- **Email:** official@bengaluru.gov.in
- **Password:** official123

---

## 🔧 Troubleshooting

### Phone Can't Connect?

**1. Check Firewall**
Windows Firewall might be blocking the connection. Allow Node.js through firewall:
- Windows Security > Firewall & network protection
- Allow an app through firewall
- Find Node.js and check both Private and Public

**2. Check WiFi**
- Phone and computer must be on same WiFi
- Not on guest network
- Not using VPN

**3. Try Alternative IP**
If `172.26.80.1` doesn't work, try:
```
http://192.168.1.6:5173
```

**4. Check Services**
Make sure all services are running:
- Backend: http://localhost:3000
- Citizen App: http://localhost:5173
- Dashboard: http://localhost:5176

---

## 📊 Current Status

```
✅ Backend Server    → Port 3000 (Running)
✅ Citizen App       → Port 5173 (Running with --host)
✅ Official Dashboard → Port 5176 (Running on localhost)
```

---

## 🎯 Quick Access

### For Phone:
```
http://172.26.80.1:5173
```

### For Computer (Dashboard):
```
http://localhost:5176
```

---

## 📝 Features Available

### Citizen App (Phone):
- ✅ Login/Register
- ✅ Interactive Map
- ✅ Report Issues with GPS
- ✅ Location Search
- ✅ Safe Route Navigation
- ✅ Female Voice Directions
- ✅ Viosa AI Chatbot
- ✅ Stats & Alerts
- ✅ Profile Management

### Official Dashboard (Computer):
- ✅ Login
- ✅ View All Reports
- ✅ Interactive Map
- ✅ Report Management
- ✅ Statistics
- ✅ Budget Tracking

---

## 🔄 If Services Stop

### Restart Citizen App (Mobile):
```bash
cd apps/citizen-app
npm run dev -- --host
```

### Restart Dashboard (Web):
```bash
cd apps/official-dashboard
npm run dev
```

### Restart Backend:
```bash
cd server
npm run dev
```

---

## 📱 Mobile Layout

The citizen app is fully responsive and optimized for mobile:
- Touch-friendly buttons
- Mobile-optimized navigation
- Responsive map controls
- Easy-to-use forms
- Bottom navigation bar

---

## ✅ Ready to Use!

**Phone Access:** http://172.26.80.1:5173
**Dashboard Access:** http://localhost:5176

All services are running and ready for testing! 🚀

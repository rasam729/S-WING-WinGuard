# WinGuard - Global Road Safety & Infrastructure Monitoring Platform

WinGuard is a comprehensive **road safety and infrastructure management system** designed for city officials and citizens. It enables real-time reporting, tracking, and resolution of road issues (potholes, broken streetlights, etc.) across the globe, with budget allocation, contractor management, and advanced analytics.

**🚀 [Quick Start Guide](./QUICKSTART.md)** — Get running in 5 minutes

## � Key Features

### **Official Dashboard** (Web)
- **Digital Twin Command Center**: Interactive global map for real-time road issue monitoring
- **Smart Issue Management**: Create, track, and resolve road issues with status updates (Critical → In Progress → Resolved)
- **Budget Allocation & Tracking**: Simulated budget suggestions + custom allocation by city officials
- **Infrastructure Installation**: Place streetlights and police booths on the map with budget simulation
- **Multi-Currency Support**: Manage budgets across 12+ global currencies (USD, INR, EUR, GBP, JPY, AUD, BRL, AED, ZAR, CAD, SGD, CNY)
- **Advanced Analytics**: 
  - Road type breakdown (NH, SH, MDR)
  - Contractor performance tracking
  - Resolution efficiency metrics
- **Real-time Notifications**: Browser notifications and in-app alerts for issue updates
- **Global Search**: Search for cities/locations anywhere in the world

### **Citizen Mobile App** (Mobile-responsive)
- **Issue Reporting**: Report potholes, broken streetlights, drainage issues with photo uploads
- **Real-time Map View**: See all reported issues on interactive map
- **Status Color Coding**: 
  - 🔴 Red = Critical (immediate action needed)
  - 🔵 Blue = In Progress (being fixed)
  - 🟢 Green = Resolved
- **Safe Route Navigation**: AI-powered route calculator that avoids high-risk areas
- **Contractor Information**: View assigned contractors for each issue
- **Road Type Display**: See NH/SH/MDR classification for reported issues
- **PWA Support**: Works offline with service worker caching
- **Browser Notifications**: Real-time alerts when reports are resolved

---

## 🏗️ Tech Stack

### **Frontend**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Maps**: React-Leaflet (OpenStreetMap/Leaflet)
- **Charts**: Chart.js + React-ChartJS-2
- **PWA**: Vite PWA Plugin (service worker + caching)
- **Styling**: Tailwind CSS

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL + PostGIS (geospatial)
- **Authentication**: JWT (Bearer tokens)
- **Real-time**: Socket.io (WebSocket)
- **Port**: 3000

### **Project Structure**
```
WinGuard/
├── apps/
│   ├── official-dashboard/      # City official dashboard
│   │   └── src/
│   │       ├── pages/           # Dashboard, Issues, Analytics, Budget, Stats
│   │       ├── components/      # AllocationModal, UI components
│   │       ├── store/           # Zustand (issues, auth)
│   │       └── data/            # globalData.ts (currencies, global issues)
│   └── citizen-app/             # Citizen mobile app (PWA)
│       └── src/
│           ├── pages/           # MapPage, ReportPage
│           ├── components/      # Chatbot, NavigationEngine
│           └── store/           # Zustand (issues)
├── server/                      # Express backend
├── shared/                      # Shared types, constants
└── package.json                 # Monorepo with npm workspaces
```

---

## 📊 Global Data Coverage

### **12+ Countries** (50+ Sample Issues Pre-loaded)
- 🇮🇳 **India**: Bangalore, Mumbai, Delhi
- 🇺🇸 **USA**: New York, Los Angeles, Chicago
- 🇬🇧 **UK**: London
- 🇩🇪 **Germany**: Berlin, Frankfurt
- 🇯🇵 **Japan**: Tokyo
- 🇦🇺 **Australia**: Sydney
- 🇧🇷 **Brazil**: São Paulo
- 🇦🇪 **UAE**: Dubai
- 🇿🇦 **South Africa**: Johannesburg
- 🇨🇦 **Canada**: Toronto
- 🇸🇬 **Singapore**: Singapore
- 🇨🇳 **China**: Beijing

### **Road Types Tracked**
- **NH** (National Highway), **SH** (State Highway), **MDR** (Major District Road)
- **Arterial**, **Motorway/Highway**, **Local** roads

### **12+ Currencies Supported**
- 🇺🇸 USD, 🇮🇳 INR, 🇬🇧 GBP, 🇪🇺 EUR, 🇯🇵 JPY, 🇦🇺 AUD, 🇧🇷 BRL, 🇦🇪 AED, 🇿🇦 ZAR, 🇨🇦 CAD, 🇸🇬 SGD, 🇨🇳 CNY

---

## 🚀 Quick Start

### **5-Minute Setup**
```bash
cd Road_Safety/WinGuard
npm install
npm run dev
```

**Access:**
- Dashboard: http://localhost:5178 (desktop)
- Citizen App: http://localhost:5179 (mobile/PWA)
- API: http://localhost:3000

**Login:**
```
Email: admin@winguard.com
Password: admin123
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup including mobile access and troubleshooting.

---

## 💰 Budget Features

- **Simulated Budget**: Automatically calculated based on issue type and location
- **Custom Allocation**: Officials override amount, select currency, set timeline
- **Multi-Currency**: Support for 12+ currencies with live rate conversion
- **Tracking**: View allocations by city, country, contractor, and issue type
- **Offline Support**: Budget allocations persist in localStorage

---

## 📱 Multi-Device Support

- **Desktop**: Full dashboard with side nav, analytics, budget pages
- **Tablet**: Responsive layout with touch-friendly controls
- **Mobile PWA**: Full-screen map, bottom nav, offline support, camera access

---

## 🔒 Authentication

**Dev Credentials:**
```
Email:    admin@winguard.com
Password: admin123
```

JWT tokens stored in localStorage, auto-attached to API requests.

---

## 📡 API Endpoints

- `GET /api/issues` - Fetch all issues
- `POST /api/reports` - Submit citizen report
- `PATCH /api/reports/:id/resolve` - Resolve report
- `POST /api/budget/allocate` - Create budget allocation
- `GET /api/notifications` - Fetch notifications
- `POST /api/infrastructure` - Install infrastructure

---

## 🔧 Development

```bash
npm run dev              # Start all dev servers
npm run build            # Build for production
npm run test             # Run tests (if configured)
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `taskkill /PID <pid> /F` (Windows) or `lsof -ti :3000 \| xargs kill -9` (Mac/Linux) |
| Mobile won't connect | Ensure mobile on same WiFi, use machine IPv4 (not localhost) |
| Map tiles not loading | Check internet, OpenStreetMap CDN accessible |
| PWA not caching | Clear Service Worker in DevTools → Application |
| Login fails | Clear localStorage, check backend running |

See [QUICKSTART.md](./QUICKSTART.md) for more help.

---

**Built with ❤️ for safer roads globally** 🌍🛣️✨

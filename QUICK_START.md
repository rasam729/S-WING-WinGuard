# WinGuard Quick Start Guide

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (Neon Cloud already configured)

## Starting the Application

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```

The server will start on `http://localhost:3000`

### 2. Start Citizen App (in a new terminal)
```bash
cd apps/citizen-app
npm install
npm run dev
```

The citizen app will start on `http://localhost:5173`

### 3. Start Official Dashboard (in a new terminal)
```bash
cd apps/official-dashboard
npm install
npm run dev
```

The dashboard will start on `http://localhost:5174`

## Login Credentials

### Citizen App
- **Email**: `citizen@winguard.com`
- **Password**: `citizen123`

### Official Dashboard
- **Email**: `official@bengaluru.gov.in`
- **Password**: `official123`

## Features

### Citizen App
- ✅ Safe route mapping with 3 route options (Safest/Balanced/Fastest)
- ✅ Viosa AI chatbot for route planning and safety queries
- ✅ Real-time hazard avoidance (15 mock issues)
- ✅ Report safety issues
- ✅ View alerts and statistics
- ✅ Profile management

### Official Dashboard
- ✅ Interactive map with glowing markers
- ✅ Simulate fixing issues (Critical → In Progress → Resolved)
- ✅ Install new infrastructure (streetlights, police booths)
- ✅ Real-time statistics with charts (Line, Pie, Bar, Stacked Bar)
- ✅ Issues management page
- ✅ Reports tracking

## Troubleshooting

### "Failed to fetch" error on login
**Solution**: Make sure the backend server is running on port 3000

```bash
cd server
npm run dev
```

### Database connection error
**Solution**: Check that the `.env` file exists in the root directory with the correct Neon database URL:

```env
DATABASE_URL=postgresql://neondb_owner:npg_HwL9Ma8tdpbi@ep-morning-dawn-aohhb76a-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Port already in use
**Solution**: Kill the process using the port or change the port in the respective config file

```bash
# Kill process on port 3000 (backend)
npx kill-port 3000

# Kill process on port 5173 (citizen app)
npx kill-port 5173

# Kill process on port 5174 (dashboard)
npx kill-port 5174
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Neon PostgreSQL                       │
│              (Cloud Database with PostGIS)               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Backend Server (Port 3000)                  │
│  • Express.js + Socket.io                               │
│  • Auth, Reports, Maps, Simulations APIs                │
│  • Real-time notifications                              │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ↓                      ↓
┌──────────────────────┐  ┌──────────────────────────────┐
│  Citizen App (5173)  │  │  Official Dashboard (5174)   │
│  • Safe Routes       │  │  • Map Simulations           │
│  • Viosa Chatbot     │  │  • Statistics & Charts       │
│  • Issue Reporting   │  │  • Issue Management          │
│  • Mock Issues Store │  │  • Mock Issues Store         │
└──────────────────────┘  └──────────────────────────────┘
```

## Mock Data

Both apps use the same 15 mock issues:
- 7 Potholes (various severities)
- 5 Broken Streetlights
- 3 Police Booths

Issues are synchronized between:
- Dashboard map (for simulation)
- Citizen app (for route calculation)
- Viosa chatbot (for intelligent responses)

## Next Steps

1. **Test Safe Routes**: 
   - Open citizen app
   - Click "My Location"
   - Ask Viosa: "Find safe route to 12.9350, 77.6200"
   - Click on any route option to view on map

2. **Test Dashboard Simulation**:
   - Open official dashboard
   - Click on any red glowing marker
   - Click "Start Fixing" to change to blue
   - Click "Mark as Resolved" to change to green

3. **Test Viosa Intelligence**:
   - Ask: "Show statistics"
   - Ask: "What's nearby?"
   - Ask: "Safety tips"
   - Ask: "Emergency help"

Enjoy using WinGuard! 🛡️

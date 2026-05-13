# WinGuard Urban Safety Platform

A comprehensive urban safety platform connecting citizens with city officials through real-time reporting and digital twin simulation for Bengaluru, India.

**🚀 [Quick Start Guide](./QUICKSTART.md)** | **📱 Demo Credentials Below**

## 🏗️ Architecture

Monorepo with three integrated components:

- **Citizen App** (`/apps/citizen-app`): Mobile PWA for reporting issues and finding safe routes
- **Official Dashboard** (`/apps/official-dashboard`): Desktop dashboard with map visualization and analytics
- **Backend Server** (`/server`): Node.js/Express API with PostgreSQL (Neon Cloud)
- **Shared Utilities** (`/shared`): Common routing logic and utilities

## ✨ Key Features

### Citizen App
- 📸 Report issues (potholes, broken streetlights) with photo + GPS
- 🗺️ Safe route navigation avoiding hazardous areas
- 📱 Progressive Web App (works on any device)
- 🔔 Real-time notifications when issues are resolved
- 🎯 Automatic location extraction from photos

### Official Dashboard
- 🗺️ Interactive map with all citizen reports and infrastructure
- 📊 Real-time analytics and statistics
- 🔧 Patch potholes and install infrastructure (streetlights, police booths, hospitals)
- 📈 Safety score and resolution rate tracking
- 🎨 Digital twin visualization of city infrastructure

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

### TL;DR

```bash
# Install dependencies
npm install

# Configure .env with Neon PostgreSQL credentials
cp .env.example .env

# Start all services
npm run dev
```

**Access:**
- Citizen App: http://localhost:5173
- Official Dashboard: http://localhost:5176
- Backend API: http://localhost:3000

### 🔐 Demo Credentials

**Citizen Account:**
- Email: `citizen@winguard.com`
- Password: `citizen123`

**Official Account:**
- Email: `official@bengaluru.gov.in`
- Password: `official123`

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet.js
- **Backend**: Node.js, Express, PostgreSQL (Neon Cloud)
- **Auth**: JWT with role-based access control
- **State**: Zustand
- **Routing**: OpenRouteService API for safe path calculation
- **Maps**: Leaflet.js with OpenStreetMap tiles

## 📁 Project Structure

```
/S-WING-WinGuard
├── /apps
│   ├── /citizen-app          # Mobile PWA
│   └── /official-dashboard   # Desktop dashboard
├── /server                   # Node.js backend
├── /shared                   # Shared utilities
├── .env.example              # Environment template
├── README.md                 # This file
└── QUICKSTART.md             # Setup guide
```

# WinGuard Urban Safety Platform

A comprehensive urban safety platform connecting citizens with city officials through real-time reporting and digital twin simulation for Bengaluru, India.

**🚀 [Quick Start Guide](./QUICKSTART.md)** | **📦 [Installation Guide](./INSTALLATION_GUIDE.md)** | **📚 [API Documentation](./API_DOCUMENTATION.md)** | **✨ [Features List](./FEATURES_IMPLEMENTATION.md)** | **📖 [Documentation Index](./DOCUMENTATION_INDEX.md)**

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
- 📴 Offline functionality with background sync
- 🌐 Works anywhere in India (global map support)

### Official Dashboard
- 🗺️ Interactive map with all citizen reports and infrastructure
- 📊 **Real-time analytics** with comprehensive charts and visualizations
- 💰 **Budget tracking** with source transparency and expense management
- 🏗️ **Contractor management** with performance tracking and ratings
- 🔧 **Maintenance scheduling** with repair history and warranty tracking
- 👷 **Engineer assignment** with automated routing and workload balancing
- 🔧 Patch potholes and install infrastructure (streetlights, police booths, hospitals)
- 📈 Safety score and resolution rate tracking
- 🎨 Digital twin visualization of city infrastructure
- 🌍 **Worldwide map support** with search and coordinate picker

### Advanced Features
- 🤖 **Automated complaint routing** based on category, severity, ward, and road type
- 📊 **Comprehensive analytics** with time-series, category, and cost analysis
- 💵 **Budget transparency** with source tracking and variance analysis
- 📅 **Preventive maintenance** scheduling with overdue alerts
- 👥 **Multi-level engineer management** with jurisdiction-based assignment
- 🔄 **Real-time updates** via WebSocket for instant notifications
- 📱 **PWA support** for offline functionality and mobile installation
- 🗺️ **Global coverage** - works for any city worldwide

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
/WinGuard
├── /apps
│   ├── /citizen-app          # Mobile PWA
│   └── /official-dashboard   # Desktop dashboard
├── /server                   # Node.js backend
├── /shared                   # Shared utilities
├── .env.example              # Environment template
├── README.md                 # This file
├── QUICKSTART.md             # Quick setup guide
├── INSTALLATION_GUIDE.md     # Detailed installation steps
├── API_DOCUMENTATION.md      # Complete API reference
├── FEATURES_IMPLEMENTATION.md # All implemented features
└── ANALYTICS_AND_BUDGET_IMPLEMENTATION.md # Analytics details
```

## 📚 Documentation

### Getting Started
- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[Installation Guide](./INSTALLATION_GUIDE.md)** - Detailed setup instructions with troubleshooting
- **[Features Documentation](./FEATURES_IMPLEMENTATION.md)** - Complete list of all implemented features

### Development
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Analytics Implementation](./ANALYTICS_AND_BUDGET_IMPLEMENTATION.md)** - Analytics and budget features

### Key Pages in Official Dashboard
1. **Dashboard** (`/`) - Main command center with interactive map
2. **Analytics** (`/analytics`) - Comprehensive analytics with charts
3. **Budget** (`/budget`) - Budget tracking and transparency
4. **Contractors** (`/contractors`) - Contractor management
5. **Maintenance** (`/maintenance`) - Maintenance scheduling and repair history
6. **Engineers** (`/engineers`) - Engineer management and assignment
7. **Statistics** (`/stats`) - Overall statistics
8. **Reports** (`/reports`) - Citizen reports management
9. **Issues** (`/issues`) - Issue tracking
10. **Simulations** (`/simulations`) - Digital twin simulations
11. **Safety Scores** (`/safety-scores`) - Safety scoring system
└── QUICKSTART.md             # Setup guide
```

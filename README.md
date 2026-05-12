# WinGuard Urban Safety Platform

A comprehensive urban safety platform connecting citizens with city officials through real-time reporting and digital twin simulation.

## 🏗️ Architecture

This is a monorepo containing three integrated components:

- **Citizen App** (`/apps/citizen-app`): Mobile-first PWA for safety issue reporting and safe routing
- **Official Dashboard** (`/apps/official-dashboard`): Desktop dashboard with digital twin simulation
- **Backend Server** (`/server`): Node.js/Express server with WebSocket support
- **Shared Utilities** (`/shared`): Common constants, types, and business logic

## ✨ Key Features

### For Citizens
- 📸 Report safety issues with photo evidence and GPS location
- 🗺️ Find safe routes prioritizing well-lit and policed areas
- 📱 Mobile-first Progressive Web App (PWA)
- 🔔 Real-time notifications when issues are resolved
- 📍 Automatic geolocation and EXIF data extraction

### For City Officials
- 🎯 Digital twin visualization of city infrastructure
- 📊 Real-time statistics and analytics dashboard
- 🔮 Simulate infrastructure changes before implementation
- 🗺️ Heatmap overlays for dark spots and crime zones
- ⚡ Real-time updates of citizen reports
- 📈 30-day trend analysis and reporting

### Technical Features
- 🔄 Real-time bidirectional communication via WebSocket
- 🔐 JWT-based authentication with role-based access control
- 🌍 Geographic boundary enforcement (5km operational radius)
- 🧮 Intelligent severity score calculation
- 🛣️ Weighted pathfinding for safe route calculation
- 🐳 Docker containerization for easy deployment
- 📦 Monorepo architecture with npm workspaces

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB (or use Docker Compose)
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd winguard-monorepo

# Install all dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration (set JWT_SECRET, MongoDB URI, etc.)
```

### Development

```bash
# Start all services concurrently
npm run dev

# Or start services individually
npm run dev:server      # Backend server on http://localhost:3000
npm run dev:citizen     # Citizen app on http://localhost:5173
npm run dev:official    # Official dashboard on http://localhost:5174
```

The development servers will start with hot-reload enabled. Open your browser to:
- Citizen App: http://localhost:5173
- Official Dashboard: http://localhost:5174
- API Server: http://localhost:3000

### Docker Deployment

```bash
# Start all services with Docker Compose (includes MongoDB)
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down

# Rebuild containers after code changes
npm run docker:build
```

## 📁 Project Structure

```
/winguard-monorepo
├── /apps
│   ├── /citizen-app          # Mobile-first PWA
│   │   ├── /src
│   │   │   ├── /components   # SafeRouteMap, PhotoUpload, NavOverlay
│   │   │   ├── /pages        # CitizenLogin, Home, ReportIssue
│   │   │   ├── /hooks        # useLocationTracker, useSafeRouting
│   │   │   └── /services     # socketClient, apiService
│   │   └── tailwind.config.js
│   │
│   └── /official-dashboard   # Desktop Digital Twin
│       ├── /src
│       │   ├── /components   # DigitalTwinMap, ControlPanel, Heatmap
│       │   ├── /pages        # AdminLogin, Dashboard, Simulations
│       │   └── /store        # Zustand state management
│       └── tailwind.config.js
│
├── /server                   # Node.js Backend
│   ├── /src
│   │   ├── /controllers      # reportHandler, authController
│   │   ├── /models           # MongoDB schemas
│   │   ├── /socket           # WebSocket handlers
│   │   └── /middleware       # Auth, validation, error handling
│   └── server.js
│
├── /shared                   # Shared Utilities
│   ├── safetyLogic.js        # Severity calculation algorithms
│   ├── mockData.json         # Initial test data
│   ├── constants.js          # POI definitions
│   └── types.ts              # Shared TypeScript types
│
├── docker-compose.yml        # Container orchestration
├── package.json              # Root workspace configuration
└── README.md
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run property-based tests
npm run test:properties

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 🔧 Configuration

### Geographic Boundary

Configure the operational area in `.env`:

```bash
COORDINATE_CENTER_LAT=40.7128  # Center latitude
COORDINATE_CENTER_LNG=-74.0060 # Center longitude
OPERATIONAL_RADIUS=5000        # Radius in meters (5km)
```

### Severity Calculation Weights

Adjust severity scoring weights in `.env`:

```bash
SEVERITY_WEIGHT_USER=0.4    # User input weight (40%)
SEVERITY_WEIGHT_TYPE=0.3    # Issue type weight (30%)
SEVERITY_WEIGHT_TIME=0.2    # Time of day weight (20%)
SEVERITY_WEIGHT_CRIME=0.1   # Crime proximity weight (10%)
```

## 📚 Documentation

- [Requirements Document](.kiro/specs/winguard-safety-platform/requirements.md)
- [Design Document](.kiro/specs/winguard-safety-platform/design.md)
- [API Documentation](./server/README.md)
- [Citizen App Guide](./apps/citizen-app/README.md)
- [Official Dashboard Guide](./apps/official-dashboard/README.md)

## 🔐 Default Credentials

**Development Only** - Change in production!

**Citizen Account:**
- Username: `citizen@test.com`
- Password: `citizen123`

**Official Account:**
- Username: `official@test.com`
- Password: `official123`

## 🛠️ Technology Stack

### Frontend
- React 18.3.1 with TypeScript
- Vite 6.3.5
- Tailwind CSS 4.1.12
- Leaflet.js 1.9.4
- Socket.io-client
- Zustand (state management)

### Backend
- Node.js with Express
- Socket.io
- MongoDB
- JWT authentication
- Multer (file uploads)

### DevOps
- Docker & Docker Compose
- npm workspaces
- Concurrently

## 📝 License

[Your License Here]

## 🤝 Contributing

[Contributing Guidelines]

## 📧 Contact

[Contact Information]

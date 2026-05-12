# WinGuard Platform - Project Summary

## 📋 Overview

WinGuard is a comprehensive urban safety platform that connects citizens with city officials through real-time reporting and digital twin simulation. The platform enables citizens to report safety issues and find safe routes, while city officials can visualize infrastructure, simulate changes, and respond to citizen reports in real-time.

## 🎯 Project Goals

1. **Citizen Empowerment**: Enable citizens to easily report safety issues with photo evidence and GPS location
2. **Safe Navigation**: Provide route calculation that prioritizes well-lit and policed areas
3. **Official Oversight**: Give city officials a digital twin view of urban safety infrastructure
4. **Predictive Planning**: Allow officials to simulate infrastructure changes before implementation
5. **Real-time Communication**: Ensure bidirectional real-time updates between citizens and officials

## 🏗️ Architecture

### Monorepo Structure

```
/winguard-monorepo
├── /apps
│   ├── /citizen-app          # Mobile-first PWA (React + Vite)
│   └── /official-dashboard   # Desktop dashboard (React + Vite)
├── /server                   # Node.js + Express backend
├── /shared                   # Shared utilities and types
├── docker-compose.yml        # Container orchestration
└── package.json              # Root workspace configuration
```

### Technology Stack

**Frontend (Both Apps)**:
- React 18.3.1 with TypeScript
- Vite 6.3.5 (build tool)
- Tailwind CSS 4.1.12 (styling)
- Leaflet.js 1.9.4 (maps)
- Socket.io-client (WebSocket)
- Zustand (state management)
- Axios (HTTP client)

**Backend**:
- Node.js with Express
- Socket.io (WebSocket server)
- MongoDB with Mongoose
- JWT authentication
- Multer (file uploads)
- bcrypt (password hashing)

**Shared**:
- TypeScript type definitions
- Business logic algorithms
- Constants and enums
- Mock data for initialization

**DevOps**:
- Docker & Docker Compose
- npm workspaces
- Nginx (production serving)

## 📦 Components

### 1. Citizen App (`/apps/citizen-app`)

**Purpose**: Mobile-first PWA for citizens to report issues and find safe routes

**Key Features**:
- User authentication (citizen role)
- Photo upload with EXIF extraction
- Geolocation-based reporting
- Safe vs Fast route calculation
- Real-time issue resolution notifications
- Offline support (PWA)

**Pages**:
- LoginPage: Authentication
- HomePage: Dashboard with action cards
- ReportIssuePage: Issue reporting form
- SafeRoutePage: Route visualization

**State Management**:
- authStore: Authentication state
- mapStore: Map center, zoom, selected location

### 2. Official Dashboard (`/apps/official-dashboard`)

**Purpose**: Desktop dashboard for city officials to monitor and simulate

**Key Features**:
- User authentication (official role only)
- Digital twin map visualization
- Real-time statistics dashboard
- Infrastructure simulation tools
- Heatmap overlays (dark spots, crime zones)
- Issue resolution workflow
- 30-day trend analysis

**Pages**:
- LoginPage: Authentication
- DashboardPage: Main dashboard with digital twin
- SimulationsPage: Infrastructure simulation tools

**State Management**:
- authStore: Authentication state
- simulationStore: Pending changes, predicted impact

### 3. Backend Server (`/server`)

**Purpose**: API server with WebSocket support for real-time communication

**Key Features**:
- RESTful API endpoints
- WebSocket server for real-time updates
- JWT-based authentication
- Role-based access control (RBAC)
- File upload handling
- Geographic boundary validation
- Severity score calculation
- Mock data initialization

**API Endpoints**:
- `/api/auth/*` - Authentication
- `/api/reports/*` - Safety issue management
- `/api/routes/*` - Route calculation
- `/api/simulations/*` - Infrastructure simulation
- `/api/infrastructure/*` - Infrastructure data and stats

**WebSocket Events**:
- `new_issue` - New safety issue reported
- `issue_resolved` - Issue marked as resolved
- `infrastructure_updated` - Infrastructure changed

**Database Models**:
- User: User accounts with roles
- SafetyIssue: Reported safety issues
- Infrastructure: City infrastructure
- Simulation: Temporary simulations
- SystemConfig: System-wide configuration

### 4. Shared Utilities (`/shared`)

**Purpose**: Common code shared across all components

**Contents**:
- `constants.js`: Shared constants and enums
- `safetyLogic.js`: Core business logic algorithms
- `types.ts`: TypeScript type definitions
- `mockData.json`: Initial test data

**Key Algorithms**:
- Severity score calculation (weighted formula)
- Haversine distance calculation
- Geographic boundary validation
- Route weight calculation for safe routing

## 🔐 Security Features

1. **Authentication**: JWT tokens with role-based claims
2. **Authorization**: Role-based access control (Citizen vs Official)
3. **Password Security**: bcrypt hashing with salt rounds
4. **Input Validation**: Request validation middleware
5. **Geographic Constraints**: Operational radius enforcement
6. **File Upload Security**: File type and size validation
7. **CORS**: Configured for specific origins
8. **Helmet**: Security headers middleware

## 🌍 Geographic Features

1. **Operational Radius**: 5km radius from configurable center point
2. **Boundary Validation**: All operations constrained to operational area
3. **Haversine Distance**: Accurate distance calculation on Earth's surface
4. **Geolocation**: Automatic GPS capture from device
5. **EXIF Extraction**: Extract GPS coordinates from photos
6. **Map Visualization**: Leaflet.js with OpenStreetMap tiles

## 📊 Data Flow

### Citizen Reports Issue

```
Citizen App → Capture Photo + GPS
           → Validate Location (within radius)
           → Calculate Severity Score
           → POST /api/reports
           → Backend stores in MongoDB
           → Broadcast via WebSocket
           → Official Dashboard receives update
```

### Official Simulates Change

```
Official Dashboard → Select simulation tool
                  → Click map location
                  → Add to pending changes
                  → POST /api/simulations/preview
                  → Backend calculates impact
                  → Return predicted impact
                  → Official reviews
                  → POST /api/simulations/:id/commit
                  → Backend persists changes
                  → Broadcast via WebSocket
                  → Citizen App receives update
```

## 🧪 Testing Strategy

1. **Property-Based Testing**: Core algorithms (severity, routing, validation)
2. **Unit Testing**: Individual components and functions
3. **Integration Testing**: API endpoints and database interactions
4. **End-to-End Testing**: Complete user workflows
5. **Performance Testing**: Load testing with Artillery

## 🚀 Deployment

### Development
```bash
npm run dev  # Starts all services with hot-reload
```

### Production (Docker)
```bash
docker-compose up -d  # Starts all services in containers
```

### Services
- MongoDB: Port 27017
- Backend: Port 3000
- Citizen App: Port 5173 (dev) / 80 (prod)
- Official Dashboard: Port 5174 (dev) / 80 (prod)

## 📝 Configuration

### Environment Variables

**Server** (`.env`):
- `NODE_ENV`: development | production
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `COORDINATE_CENTER_LAT`: Center latitude
- `COORDINATE_CENTER_LNG`: Center longitude
- `OPERATIONAL_RADIUS`: Radius in meters (default: 5000)

**Frontend** (`.env`):
- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket server URL

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6) - Main brand color
- **Severity Low**: Green (#22c55e)
- **Severity Medium**: Yellow (#eab308)
- **Severity High**: Red (#ef4444)
- **Infrastructure Police**: Blue (#3b82f6)
- **Infrastructure Streetlight**: Amber (#f59e0b)
- **Infrastructure Hospital**: Pink (#ec4899)
- **Simulated**: Purple (#8b5cf6)

### Typography
- Font Family: Inter, system-ui, sans-serif
- Responsive sizing with Tailwind utilities

## 📚 Documentation

- [Root README](./README.md) - Quick start and overview
- [Server README](./server/README.md) - Backend API documentation
- [Citizen App README](./apps/citizen-app/README.md) - Citizen app guide
- [Official Dashboard README](./apps/official-dashboard/README.md) - Dashboard guide
- [Requirements](../.kiro/specs/winguard-safety-platform/requirements.md) - Detailed requirements
- [Design Document](../.kiro/specs/winguard-safety-platform/design.md) - Architecture and design

## 🔄 Development Workflow

1. **Install Dependencies**: `npm install` at root
2. **Start Development**: `npm run dev`
3. **Make Changes**: Edit files with hot-reload
4. **Test**: `npm test`
5. **Build**: `npm run build`
6. **Deploy**: `npm run docker:up`

## 🎯 Next Steps

### Immediate Priorities
1. ✅ Complete monorepo structure
2. ✅ Set up all three applications
3. ✅ Configure Docker deployment
4. 🔄 Integrate existing UI components from stitch designs
5. 🔄 Implement Leaflet map components
6. 🔄 Complete WebSocket integration
7. 🔄 Add property-based tests

### Future Enhancements
- Push notifications for mobile devices
- Advanced analytics and reporting
- Multi-language support
- Accessibility improvements (WCAG compliance)
- Performance optimizations
- CI/CD pipeline setup
- Production monitoring and logging

## 👥 Team Roles

- **Frontend Developers**: Citizen App and Official Dashboard
- **Backend Developers**: Server API and WebSocket
- **DevOps Engineers**: Docker, deployment, monitoring
- **QA Engineers**: Testing strategy and execution
- **UX/UI Designers**: Design system and user experience

## 📞 Support

For questions or issues:
1. Check documentation in respective README files
2. Review design document for architecture details
3. Check requirements document for feature specifications
4. Contact development team

## 📄 License

[Your License Here]

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Development Phase - Monorepo Structure Complete

<div align="center">

<img src="./WinGuard_Logo.png" alt="WinGuard Logo" width="180"/>

# 🛡️ WinGuard
### *Global Road Safety & Infrastructure Monitoring Platform*

> **Empowering citizens. Enabling officials. Fixing cities — in real time.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-WebSocket-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-PWA-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 🌍 The Problem

Every year, **millions of road-related accidents** occur due to unaddressed potholes, broken streetlights, and deteriorating infrastructure. Citizens have no efficient way to report issues, officials lack real-time visibility, and the resolution cycle is slow and opaque.

**WinGuard** closes this loop.

---

## 💡 What We Built

WinGuard is a **full-stack, production-ready urban safety platform** that connects citizens directly with city officials through:

- 📱 **A citizen mobile PWA** — report issues with photo + GPS in seconds
- 🖥️ **An official command dashboard** — manage, prioritize, and resolve issues on a live digital twin map
- ⚡ **Real-time WebSocket sync** — both apps update live, no refresh needed
- 💰 **Budget allocation engine** — officials allocate funds across 12+ global currencies

---

## ✨ Key Features

### 🏛️ Official Dashboard
| Feature | Description |
|---|---|
| 🗺️ Digital Twin Map | Live global infrastructure map via Leaflet + OpenStreetMap |
| 📊 Analytics Dashboard | Resolution rates, contractor performance, road-type breakdown |
| 🔧 Issue Management | Create/track/resolve issues (Critical → In Progress → Resolved) |
| 💰 Budget Allocation | Multi-currency budget simulation & fund tracking |
| 🏗️ Infrastructure Install | Place streetlights & police booths directly on the map |
| 🔔 Real-time Alerts | WebSocket-powered in-app & browser notifications |
| 🌍 Global Search | Search and jump to any city in the world |

### 📱 Citizen Mobile App (PWA)
| Feature | Description |
|---|---|
| 📸 Issue Reporting | Photo + GPS auto-detected location, submitted in one tap |
| 🗺️ Live Map View | See all issues near you — color-coded by severity |
| 🛣️ Safe Route Planner | AI-powered routing that avoids high-risk road zones |
| 🔔 Push Notifications | Notified when your report gets resolved |
| 📴 Offline Support | Service worker caching for offline use |
| 📱 PWA Installable | Works like a native app on Android/iOS |

---

## 🏗️ Architecture

```
WinGuard (Monorepo — npm workspaces)
├── apps/
│   ├── citizen-app/          # React 18 + Vite PWA (Mobile)
│   │   └── src/
│   │       ├── pages/        # MapPage, ReportPage, SafeRoute
│   │       ├── components/   # Chatbot, NavigationEngine, Notifications
│   │       └── store/        # Zustand state (issues, auth)
│   └── official-dashboard/   # React 18 + Vite (Desktop)
│       └── src/
│           ├── pages/        # Dashboard, Issues, Analytics, Budget, Stats
│           ├── components/   # AllocationModal, InfrastructurePanel, Charts
│           └── store/        # Zustand state (issues, auth, budget)
├── server/                   # Node.js + Express + TypeScript
│   └── src/
│       ├── routes/           # issues, reports, budget, notifications, infra
│       ├── middleware/        # JWT auth, role-based access control
│       └── db/               # PostgreSQL + PostGIS queries
├── shared/                   # Shared types, constants, utilities
├── database/
│   └── sql/                  # All schema + seed SQL files
├── scripts/                  # Setup, test, and utility scripts
├── docker-compose.yml        # One-command Docker setup
└── .env.example              # Environment variable template
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 20 and **npm** ≥ 10
- A **PostgreSQL** database (we use [Neon Cloud](https://neon.tech) — free tier works great)

### 1. Clone & Install

```bash
git clone https://github.com/rasam729/S-WING-WinGuard.git
cd S-WING-WinGuard
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your PostgreSQL connection URL and JWT secret in .env
```

Required `.env` variables:
```env
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_super_secret_key
PORT=3000
```

### 3. Initialize Database

```bash
# Run the schema setup (using Neon or any PostgreSQL instance)
psql $DATABASE_URL < database/sql/init-cloud-db.sql
psql $DATABASE_URL < database/sql/global-sample-data.sql
```

### 4. Start Everything

```bash
npm run dev
```

This starts all three services concurrently:

| Service | URL | Description |
|---|---|---|
| 🖥️ Official Dashboard | http://localhost:5174 | City official interface |
| 📱 Citizen App | http://localhost:5173 | Mobile PWA |
| ⚙️ Backend API | http://localhost:3000 | REST + WebSocket |

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| 👨‍💼 City Official | `admin@winguard.com` | `admin123` |
| 👤 Citizen | `citizen@winguard.com` | `citizen123` |

---

## 🐳 Docker (Alternative)

```bash
# Start with Docker Compose
docker-compose up -d
```

---

## 🌐 Global Coverage

WinGuard ships with **50+ pre-seeded sample issues** across 12+ countries:

🇮🇳 India &nbsp;|&nbsp; 🇺🇸 USA &nbsp;|&nbsp; 🇬🇧 UK &nbsp;|&nbsp; 🇩🇪 Germany &nbsp;|&nbsp; 🇯🇵 Japan &nbsp;|&nbsp; 🇦🇺 Australia &nbsp;|&nbsp; 🇧🇷 Brazil &nbsp;|&nbsp; 🇦🇪 UAE &nbsp;|&nbsp; 🇿🇦 South Africa &nbsp;|&nbsp; 🇨🇦 Canada &nbsp;|&nbsp; 🇸🇬 Singapore &nbsp;|&nbsp; 🇨🇳 China

### 12+ Currencies Supported
`USD` `INR` `GBP` `EUR` `JPY` `AUD` `BRL` `AED` `ZAR` `CAD` `SGD` `CNY`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State** | Zustand |
| **Maps** | Leaflet.js + OpenStreetMap |
| **Charts** | Chart.js + React-ChartJS-2 |
| **PWA** | Vite PWA Plugin (Service Worker) |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL + PostGIS (Neon Cloud) |
| **Auth** | JWT (role-based: citizen / official) |
| **Real-time** | Socket.io WebSocket |
| **Routing** | OpenRouteService API |
| **DevOps** | Docker, docker-compose |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/issues` | Fetch all road issues |
| `POST` | `/api/reports` | Submit a citizen report |
| `PATCH` | `/api/reports/:id/resolve` | Resolve a report |
| `POST` | `/api/budget/allocate` | Allocate budget to an issue |
| `GET` | `/api/notifications` | Fetch user notifications |
| `POST` | `/api/infrastructure` | Install infrastructure on map |
| `GET` | `/api/analytics` | Dashboard analytics data |

---

## 🔧 Development Scripts

```bash
npm run dev              # Start all 3 dev servers concurrently
npm run dev:server       # Start backend only
npm run dev:citizen      # Start citizen app only
npm run dev:official     # Start official dashboard only
npm run build            # Production build (all workspaces)
npm run lint             # Lint all workspaces
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|---|---|
| Port already in use | Kill the process: `npx kill-port 3000 5178 5179` |
| Mobile can't connect | Use your machine's IPv4 (not `localhost`) — same WiFi required |
| Map tiles not loading | Check internet connection; OpenStreetMap CDN must be accessible |
| Login fails | Check `.env` has correct `JWT_SECRET`; clear `localStorage` |
| DB connection error | Verify `DATABASE_URL` in `.env`; check Neon dashboard for wake-up delay |

---

## 👥 Team

Built with ❤️ by **Team S-WING** for safer roads worldwide 🌍🛣️

---

<div align="center">

**⭐ Star this repo if WinGuard made you feel safer! ⭐**

</div>

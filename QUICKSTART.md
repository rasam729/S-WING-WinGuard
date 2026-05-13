# WinGuard - Quick Start Guide

## Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Neon PostgreSQL account (cloud database)

## 1. Clone & Install

```bash
git clone https://github.com/rasam729/S-WING-WinGuard.git
cd S-WING-WinGuard
npm install
```

## 2. Configure Environment

Copy `.env.example` to `.env` and update with your Neon PostgreSQL credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=your_neon_postgres_connection_string
JWT_SECRET=your_secret_key_here
PORT=3000
```

## 3. Initialize Database

```bash
# Run database migrations
node server/src/config/init-db.js
```

## 4. Start Services

### Option A: All Services (Recommended for Development)
```bash
npm run dev
```

This starts:
- Backend Server: http://localhost:3000
- Citizen App: http://localhost:5173
- Official Dashboard: http://localhost:5176

### Option B: Individual Services
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Citizen App
cd apps/citizen-app
npm run dev

# Terminal 3 - Official Dashboard
cd apps/official-dashboard
npm run dev
```

## 5. Access Applications

### Citizen App (Mobile)
- URL: http://localhost:5173
- For mobile access: http://YOUR_LOCAL_IP:5173
- Demo Login: `citizen@winguard.com` / `citizen123`

### Official Dashboard (Desktop)
- URL: http://localhost:5176
- Demo Login: `official@bengaluru.gov.in` / `official123`

## 6. Test Features

### Citizen App
1. Login with demo credentials
2. Navigate to "Report Issue" tab
3. Upload a photo with GPS data or use current location
4. Select issue type (Pothole, Streetlight, etc.)
5. Submit report
6. Check "Safe Route" tab to find safest path

### Official Dashboard
1. Login with demo credentials
2. View citizen reports on map (purple markers)
3. Click "Patch Pothole" to resolve issues
4. Click "Install Hospital" to add new infrastructure
5. View analytics in Statistics tab

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5173
npx kill-port 5173

# Kill process on port 5176
npx kill-port 5176
```

### Database Connection Error
- Verify Neon PostgreSQL credentials in `.env`
- Check if database is accessible
- Run `node test-db.js` to test connection

### Mobile Access Not Working
```bash
# Start citizen app with host flag
cd apps/citizen-app
npm run dev -- --host
```

Then access from mobile: http://YOUR_LOCAL_IP:5173

## Build for Production

```bash
# Build all apps
npm run build

# Build individual apps
cd apps/citizen-app && npm run build
cd apps/official-dashboard && npm run build
```

## Need Help?

Check the main [README.md](./README.md) for detailed documentation.

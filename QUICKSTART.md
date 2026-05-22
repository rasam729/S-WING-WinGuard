# 🚀 WinGuard Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Neon cloud)
- Git

## 1. Clone & Install

```bash
git clone <repository-url>
cd WinGuard
npm install
```

## 2. Environment Setup

Create `.env` file in root:
```env
# Database
DATABASE_URL=your_neon_postgresql_url

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5175
```

## 3. Database Setup

Run the SQL files in order:
```bash
# 1. Create tables
psql $DATABASE_URL -f init-cloud-db.sql

# 2. Add notifications table
psql $DATABASE_URL -f add-notifications-table.sql

# 3. Add infrastructure table (optional)
psql $DATABASE_URL -f add-infrastructure-table.sql
```

## 4. Start Services

### Backend Server
```bash
cd server
npm install
npm run dev
```
Server runs on: http://localhost:3000

### Citizen App
```bash
cd apps/citizen-app
npm install
npm run dev -- --host
```
App runs on: http://localhost:5173

### Official Dashboard
```bash
cd apps/official-dashboard
npm install
npm run dev
```
Dashboard runs on: http://localhost:5175

## 5. Demo Credentials

**Citizen App:**
- Email: `citizen@winguard.com`
- Password: `citizen123`

**Official Dashboard:**
- Email: `official@bengaluru.gov.in`
- Password: `official123`

## 6. Key Features

### Citizen App (http://localhost:5173)
- 📍 View safety issues on India-wide map
- 📝 Report new issues with photos
- 🔔 Receive notifications on issue status
- 🗺️ Search any place in India
- 📌 Pick coordinates by clicking map
- 🤖 Viosa AI chatbot assistance

### Official Dashboard (http://localhost:5175)
- 🗺️ Monitor issues across India
- ✅ Update issue status (In Progress/Resolved)
- 📊 View statistics and analytics
- 🔍 Search places and navigate map
- 📌 Pick coordinates for new installations
- 🚦 Simulate infrastructure installations

## 7. Testing the App

### Test Report Submission
1. Open citizen app
2. Login with citizen credentials
3. Click "Report Issue" button
4. Fill in details and submit
5. Check dashboard to see the new issue

### Test Status Updates
1. Open dashboard
2. Login with official credentials
3. Click any issue marker on map
4. Click "Start Fixing" or "Mark as Resolved"
5. Check citizen app alerts for notification

### Test Search
1. In search bar, type: "Uttarahalli Bus Stand"
2. Select from dropdown results
3. Map flies to location
4. Try: "Kota Airport", "India Gate Delhi", etc.

### Test Coordinate Picker
1. Click "Pick Coordinates" button
2. Click anywhere on map
3. See coordinates and place name
4. Copy coordinates if needed

## 8. Troubleshooting

### Services not starting?
```bash
# Kill existing processes
pkill -f "node"

# Restart services
cd server && npm run dev
cd apps/citizen-app && npm run dev -- --host
cd apps/official-dashboard && npm run dev
```

### Database connection error?
- Verify DATABASE_URL in .env
- Check Neon dashboard for connection string
- Ensure database tables are created

### Port already in use?
```bash
# Find and kill process on port
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

## 9. Project Structure

```
WinGuard/
├── apps/
│   ├── citizen-app/          # Mobile citizen app
│   └── official-dashboard/   # Official dashboard
├── server/                    # Backend API
├── shared/                    # Shared types/constants
├── .env                       # Environment variables
└── README.md                  # Full documentation
```

## 10. API Endpoints

### Reports
- `GET /api/reports/all` - Get all reports
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id/status` - Update status

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read

### Map
- `GET /api/map/map-data` - Get map issues

## 11. Features Overview

### 🗺️ India-Wide Mapping
- Default center: Center of India (20.5937°N, 78.9629°E)
- Mock issues across 9 major cities
- Search any place in India
- Coordinate picker with reverse geocoding

### 🎨 Professional UI
- Balanced light/dark theme
- Dark cyan-green patterned background
- Light cards for content
- Orange accent elements
- Traffic-themed design

### 🔍 Enhanced Search
- Google Maps-style search
- Multiple search strategies
- Finds bus stands, airports, landmarks
- Shows top 8 results
- Address details included

### 🔔 Real-Time Updates
- Socket.io for instant notifications
- Status change alerts
- Live map updates
- 30-second polling backup

## 12. Development Tips

### Hot Reload
All apps support hot reload - changes reflect immediately

### Debug Mode
Check browser console for logs and errors

### API Testing
Use the `.http` files with REST Client extension

### Database Queries
Use Neon dashboard SQL editor for quick queries

## 13. Production Deployment

### Environment Variables
Update for production:
- `NODE_ENV=production`
- `DATABASE_URL=<production_db>`
- `CORS_ORIGIN=<production_urls>`

### Build Commands
```bash
# Backend
cd server && npm run build

# Citizen App
cd apps/citizen-app && npm run build

# Dashboard
cd apps/official-dashboard && npm run build
```

## 14. Support

### Documentation
- Full docs: README.md
- API examples: safety-score-api-examples.http

### Common Issues
- **Search not working**: Check internet connection (Nominatim API)
- **Map not loading**: Verify OpenStreetMap tiles accessible
- **Reports not showing**: Check database connection and tables

## 15. Quick Commands

```bash
# Install all dependencies
npm install

# Start backend
cd server && npm run dev

# Start citizen app
cd apps/citizen-app && npm run dev -- --host

# Start dashboard
cd apps/official-dashboard && npm run dev

# Run all tests
npm test

# Build for production
npm run build
```

---

## ✅ You're Ready!

1. ✅ Services running
2. ✅ Database connected
3. ✅ Apps accessible
4. ✅ Demo credentials working

**Start exploring WinGuard!** 🎉

---

**Need Help?**
- Check README.md for detailed documentation
- Review code comments for implementation details
- Check browser console for debugging

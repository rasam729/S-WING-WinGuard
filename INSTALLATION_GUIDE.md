# WinGuard - Complete Installation Guide

This guide will walk you through setting up the WinGuard Urban Safety Platform from scratch.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.0.0 or higher)
- **npm** (v10.0.0 or higher)
- **Git** (for cloning the repository)
- **PostgreSQL** account on [Neon](https://neon.tech) (free tier available)

---

## 🚀 Step 1: Clone the Repository

```bash
git clone <repository-url>
cd WinGuard
```

---

## 🔧 Step 2: Install Dependencies

The project uses npm workspaces, so a single command installs all dependencies:

```bash
npm install
```

This will install dependencies for:
- Root workspace
- Backend server (`/server`)
- Citizen app (`/apps/citizen-app`)
- Official dashboard (`/apps/official-dashboard`)
- Shared utilities (`/shared`)

**Note**: If you encounter any errors, try:
```bash
npm install --legacy-peer-deps
```

---

## 🗄️ Step 3: Database Setup

### 3.1 Create Neon PostgreSQL Database

1. Go to [Neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Create a new database (e.g., `winguard_db`)
5. Copy your connection string (it looks like: `postgresql://user:password@host/database`)

### 3.2 Enable PostGIS Extension

In your Neon SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3.3 Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your database credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PGHOST=your-host.neon.tech
PGDATABASE=winguard_db
PGUSER=your-username
PGPASSWORD=your-password
PGPORT=5432

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:5176

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# WebSocket Configuration
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=5000

# OpenRouteService API (for routing)
OPENROUTE_API_KEY=your-openroute-api-key
```

### 3.4 Run Database Migrations

Run the schema updates to create all tables:

```bash
cd server
npm run migrate
```

Or manually run the SQL files in this order:

1. `server/database/schema-updates-postgres.sql`
2. `add-infrastructure-table.sql`
3. `add-notifications-table.sql`

You can run these in the Neon SQL Editor or using psql:

```bash
psql $DATABASE_URL -f server/database/schema-updates-postgres.sql
psql $DATABASE_URL -f add-infrastructure-table.sql
psql $DATABASE_URL -f add-notifications-table.sql
```

---

## 👥 Step 4: Create Test Users

Run the user creation script:

```bash
cd server
npm run create-users
```

This creates:
- **Citizen Account**: `citizen@winguard.com` / `citizen123`
- **Official Account**: `official@bengaluru.gov.in` / `official123`

Or manually run:

```bash
cd server
npx ts-node src/scripts/createTestUsers.ts
```

---

## 🎨 Step 5: Install Chart.js Dependencies

The Analytics and Budget pages require Chart.js:

```bash
cd apps/official-dashboard
npm install chart.js react-chartjs-2
```

---

## 🏃 Step 6: Start Development Servers

### Option 1: Start All Services at Once

From the root directory:

```bash
npm run dev
```

This starts:
- Backend API on `http://localhost:3000`
- Citizen App on `http://localhost:5173`
- Official Dashboard on `http://localhost:5176`

### Option 2: Start Services Individually

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Citizen App:**
```bash
npm run dev:citizen
```

**Terminal 3 - Official Dashboard:**
```bash
npm run dev:official
```

---

## ✅ Step 7: Verify Installation

### 7.1 Check Backend Health

Open your browser and visit:
```
http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-05-28T..."
}
```

### 7.2 Test Citizen App

1. Open `http://localhost:5173`
2. Click "Login" or "Sign Up"
3. Use credentials: `citizen@winguard.com` / `citizen123`
4. You should see the map page

### 7.3 Test Official Dashboard

1. Open `http://localhost:5176`
2. Login with: `official@bengaluru.gov.in` / `official123`
3. You should see the command center dashboard

---

## 🔍 Step 8: Verify All Features

### Test Each Page in Official Dashboard:

1. **Dashboard** (`/`) - Main command center with map ✅
2. **Statistics** (`/stats`) - Overall statistics ✅
3. **Reports** (`/reports`) - Citizen reports ✅
4. **Issues** (`/issues`) - Issue tracking ✅
5. **Simulations** (`/simulations`) - Digital twin ✅
6. **Safety Scores** (`/safety-scores`) - Safety scoring ✅
7. **Analytics** (`/analytics`) - Charts and analytics ✅
8. **Budget** (`/budget`) - Budget tracking ✅
9. **Contractors** (`/contractors`) - Contractor management ✅
10. **Maintenance** (`/maintenance`) - Maintenance schedules ✅
11. **Engineers** (`/engineers`) - Engineer management ✅

### Test Citizen App Features:

1. **Map View** - View issues on map ✅
2. **Report Issue** - Submit new reports ✅
3. **Safe Routes** - Calculate safe routes ✅
4. **Alerts** - View notifications ✅
5. **Stats** - View statistics ✅
6. **Profile** - User profile ✅

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Check your `.env` file has correct database credentials
2. Verify your Neon database is running
3. Check if PostGIS extension is enabled
4. Test connection with: `psql $DATABASE_URL`

### Issue: "Port already in use"

**Solution:**
1. Kill the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   ```
2. Or change the port in `.env`

### Issue: "Module not found"

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf server/node_modules
npm install
```

### Issue: "Chart.js not rendering"

**Solution:**
```bash
cd apps/official-dashboard
npm install chart.js react-chartjs-2 --save
```

### Issue: "CORS errors"

**Solution:**
1. Check `CORS_ORIGIN` in `.env` includes your frontend URLs
2. Restart the backend server

### Issue: "WebSocket connection failed"

**Solution:**
1. Check if backend is running on port 3000
2. Check browser console for specific error
3. Verify `WS_PING_INTERVAL` and `WS_PING_TIMEOUT` in `.env`

---

## 📦 Building for Production

### Build All Applications

```bash
npm run build
```

This builds:
- Backend server (TypeScript → JavaScript)
- Citizen app (optimized production build)
- Official dashboard (optimized production build)

### Build Individually

```bash
# Backend
npm run build:server

# Citizen App
npm run build:citizen

# Official Dashboard
npm run build:official
```

### Production Environment Variables

Update `.env` for production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your-production-database-url
JWT_SECRET=your-strong-production-secret
CORS_ORIGIN=https://your-production-domain.com
```

---

## 🚀 Deployment

### Backend Deployment (Recommended: Railway, Render, or Heroku)

1. **Railway:**
   ```bash
   railway login
   railway init
   railway up
   ```

2. **Render:**
   - Connect your GitHub repository
   - Set build command: `npm run build:server`
   - Set start command: `npm run start:server`
   - Add environment variables

3. **Heroku:**
   ```bash
   heroku create winguard-backend
   heroku config:set DATABASE_URL=your-db-url
   git push heroku main
   ```

### Frontend Deployment (Recommended: Vercel or Netlify)

1. **Vercel:**
   ```bash
   cd apps/citizen-app
   vercel
   
   cd ../official-dashboard
   vercel
   ```

2. **Netlify:**
   ```bash
   cd apps/citizen-app
   netlify deploy --prod
   
   cd ../official-dashboard
   netlify deploy --prod
   ```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database
- [ ] Review and update security headers
- [ ] Enable HTTPS for all endpoints

---

## 📊 Database Backup

### Backup Database

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore Database

```bash
psql $DATABASE_URL < backup.sql
```

### Automated Backups (Neon)

Neon provides automatic backups. Configure in your Neon dashboard:
- Daily backups
- Point-in-time recovery
- Retention period

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Backend tests
npm run test:server

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## 📈 Monitoring

### Health Check Endpoints

- Backend: `http://localhost:3000/health`
- Database: Check connection in Neon dashboard

### Logs

- Backend logs: Console output
- Frontend logs: Browser console
- Production logs: Configure logging service (e.g., LogRocket, Sentry)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review `README.md` for general information
3. Check `FEATURES_IMPLEMENTATION.md` for feature details
4. Review server logs for error messages
5. Check browser console for frontend errors

---

## 📝 Next Steps

After successful installation:

1. ✅ Explore all features in the Official Dashboard
2. ✅ Test the Citizen App on mobile devices
3. ✅ Customize the map center for your city
4. ✅ Add sample data for testing
5. ✅ Configure routing rules for your organization
6. ✅ Set up budget allocations
7. ✅ Add contractors and engineers
8. ✅ Create maintenance schedules

---

## 🎉 Success!

You now have a fully functional WinGuard Urban Safety Platform!

**Access URLs:**
- Citizen App: http://localhost:5173
- Official Dashboard: http://localhost:5176
- Backend API: http://localhost:3000

**Demo Credentials:**
- Citizen: `citizen@winguard.com` / `citizen123`
- Official: `official@bengaluru.gov.in` / `official123`

---

**Last Updated**: May 28, 2026
**Version**: 1.0.0

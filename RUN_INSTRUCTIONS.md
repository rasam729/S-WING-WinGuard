# 🚀 How to Run WinGuard Platform

## Quick Start (Easiest Method)

### Option 1: Use the Automated Script (Windows)

Simply double-click the `start-all.bat` file in the WinGuard folder!

This will automatically:
1. ✅ Start the Backend API Server (Port 3000)
2. ✅ Start the Official Dashboard (Port 5173)
3. ✅ Start the Citizen App (Port 5174)
4. ✅ Open the dashboard in your browser

---

## Manual Start (Step by Step)

### Prerequisites

Before running, make sure you have:
- ✅ Node.js 16+ installed ([Download](https://nodejs.org/))
- ✅ PostgreSQL with PostGIS installed
- ✅ Database migrations completed (see QUICK_START.md)

### Step 1: Start Backend API

Open a terminal/command prompt:

```bash
cd server
npm install  # First time only
npm run dev
```

✅ **Backend running at:** http://localhost:3000

### Step 2: Start Official Dashboard (Web)

Open a **new** terminal/command prompt:

```bash
cd apps/official-dashboard
npm install  # First time only
npm run dev
```

✅ **Dashboard running at:** http://localhost:5173

### Step 3: Start Citizen App (Web)

Open a **new** terminal/command prompt:

```bash
cd apps/citizen-app
npm install  # First time only
npm run dev
```

✅ **Citizen App running at:** http://localhost:5174

---

## 📱 Running Citizen App on Mobile (Android)

### Prerequisites for Mobile

- ✅ Android Studio installed
- ✅ Java JDK 11+ installed
- ✅ Android SDK installed

### Build and Run on Android

```bash
cd apps/citizen-app

# First time setup
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
# App name: WinGuard
# Package ID: com.winguard.app

# Add Android platform
npx cap add android

# Build the web app
npm run build

# Copy to Android
npx cap copy android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Connect your Android device or start an emulator
3. Click the green "Run" button (▶️)

### Quick Run with Live Reload

```bash
cd apps/citizen-app
npm run build
npx cap copy
npx cap run android -l --external
```

This will:
- Build the app
- Install on your device
- Enable live reload for development

---

## 🌐 Accessing the Applications

### Official Dashboard (City Officials)
- **URL:** http://localhost:5173
- **Login:** Use official credentials
- **Features:**
  - View all reports on map
  - Manage issues
  - Budget tracking
  - AI simulations
  - Analytics

### Citizen App (Citizens)
- **Web URL:** http://localhost:5174
- **Mobile:** Install APK on Android device
- **Features:**
  - Report issues
  - Take photos
  - GPS location
  - View report status
  - Offline support

### API Server
- **URL:** http://localhost:3000
- **API Docs:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/health

---

## 🔧 Troubleshooting

### Port Already in Use

If you get "Port already in use" error:

**Windows:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error

1. Make sure PostgreSQL is running
2. Check connection string in `server/.env`
3. Verify database exists and migrations ran

```bash
# Check if PostgreSQL is running
# Windows:
sc query postgresql-x64-14

# Mac:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql
```

### Module Not Found Error

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear build cache
npm run clean  # if available
rm -rf dist build

# Rebuild
npm run build
```

---

## 📱 Mobile App Installation

### Install APK on Android Device

1. **Build the APK:**
   ```bash
   cd apps/citizen-app/android
   ./gradlew assembleRelease
   ```

2. **Find the APK:**
   - Location: `android/app/build/outputs/apk/release/app-release.apk`

3. **Transfer to Phone:**
   - Email it to yourself
   - Use USB cable and copy to phone
   - Upload to Google Drive and download on phone

4. **Install:**
   - Open the APK file on your phone
   - Allow "Install from Unknown Sources" if prompted
   - Tap "Install"

### Enable Developer Mode (for testing)

1. Go to Settings > About Phone
2. Tap "Build Number" 7 times
3. Go back to Settings > Developer Options
4. Enable "USB Debugging"

---

## 🔄 Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `server/src/`
   - Server auto-restarts (nodemon)
   - Test at http://localhost:3000

2. **Dashboard Changes:**
   - Edit files in `apps/official-dashboard/src/`
   - Browser auto-refreshes (Vite HMR)
   - View at http://localhost:5173

3. **Citizen App Changes:**
   - Edit files in `apps/citizen-app/src/`
   - Browser auto-refreshes (Vite HMR)
   - View at http://localhost:5174
   - For mobile: Run `npx cap copy` and reload app

### Testing Changes on Mobile

```bash
# After making changes
cd apps/citizen-app
npm run build
npx cap copy
# App will auto-reload if using live reload
```

---

## 🌐 Production Deployment

### Build for Production

```bash
# Backend
cd server
npm run build
npm start

# Dashboard
cd apps/official-dashboard
npm run build
# Serve the 'dist' folder

# Citizen App
cd apps/citizen-app
npm run build
# Serve the 'dist' folder or build mobile app
```

### Serve Built Apps

```bash
# Install serve globally
npm install -g serve

# Serve dashboard
cd apps/official-dashboard/dist
serve -s . -p 3001

# Serve citizen app
cd apps/citizen-app/dist
serve -s . -p 3002
```

---

## 📊 Verify Everything is Working

### Checklist

- [ ] Backend API responds at http://localhost:3000
- [ ] Dashboard loads at http://localhost:5173
- [ ] Citizen app loads at http://localhost:5174
- [ ] Can login to dashboard
- [ ] Can view map with issues
- [ ] Can create report in citizen app
- [ ] Database queries work
- [ ] No console errors

### Test API Endpoints

```bash
# Test backend health
curl http://localhost:3000/health

# Test reports endpoint
curl http://localhost:3000/api/reports/all

# Test engineers endpoint
curl http://localhost:3000/api/engineers

# Test budget analytics
curl http://localhost:3000/api/budget/analytics
```

---

## 🎯 Quick Reference

### URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:3000 | API Server |
| Dashboard | http://localhost:5173 | City Officials |
| Citizen App | http://localhost:5174 | Citizens (Web) |
| Citizen App | APK on device | Citizens (Mobile) |

### Default Ports

- **3000** - Backend API
- **5173** - Official Dashboard
- **5174** - Citizen App
- **5432** - PostgreSQL Database

### Commands

```bash
# Start backend
cd server && npm run dev

# Start dashboard
cd apps/official-dashboard && npm run dev

# Start citizen app
cd apps/citizen-app && npm run dev

# Build mobile app
cd apps/citizen-app && npm run build && npx cap copy

# Run on Android
cd apps/citizen-app && npx cap run android
```

---

## 🆘 Getting Help

### Common Issues

1. **"Cannot find module"**
   - Run `npm install` in the respective folder

2. **"Port already in use"**
   - Kill the process using that port
   - Or change port in configuration

3. **"Database connection failed"**
   - Check PostgreSQL is running
   - Verify credentials in `.env`
   - Run database migrations

4. **"Build failed"**
   - Clear node_modules: `rm -rf node_modules`
   - Reinstall: `npm install`
   - Clear cache: `npm cache clean --force`

5. **Mobile app not installing**
   - Enable "Unknown Sources" in Android settings
   - Check APK is not corrupted
   - Try rebuilding: `./gradlew clean assembleRelease`

### Support Resources

- **Documentation:** Check all .md files in WinGuard folder
- **Quick Start:** QUICK_START.md
- **Offline Setup:** OFFLINE_SETUP.md
- **Deployment:** DEPLOYMENT_CHECKLIST.md
- **Architecture:** ARCHITECTURE.md

---

## 🎉 You're All Set!

Your WinGuard platform should now be running:

✅ **Backend API** - Processing requests
✅ **Official Dashboard** - For city officials
✅ **Citizen App** - For citizens (web and mobile)
✅ **Offline Support** - Works without internet
✅ **Real-time Sync** - Auto-syncs when online

**Next Steps:**
1. Test the dashboard at http://localhost:5173
2. Test the citizen app at http://localhost:5174
3. Try creating a report
4. Test offline functionality
5. Build mobile app for Android

---

**Happy Testing! 🚀**

For detailed setup instructions, see:
- QUICK_START.md - 5-minute setup
- OFFLINE_SETUP.md - Offline functionality
- DEPLOYMENT_CHECKLIST.md - Production deployment

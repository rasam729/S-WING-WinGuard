# WinGuard Offline Functionality Setup

## 🔌 Making WinGuard Work Offline

This guide explains how to enable offline functionality for both the Citizen App and Official Dashboard.

---

## 📱 Offline Strategy

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Offline Architecture                      │
└─────────────────────────────────────────────────────────────┘

Online Mode:
  App ──► API Server ──► PostgreSQL Database

Offline Mode:
  App ──► IndexedDB (Local Storage) ──► Sync Queue
                                           │
                                           ▼
                                    (Syncs when online)
```

### What Works Offline

✅ **Citizen App:**
- View previously loaded reports
- Create new reports (saved locally)
- Take photos
- Mark GPS location
- View map (cached tiles)
- Auto-sync when connection restored

✅ **Official Dashboard:**
- View cached issues
- View cached statistics
- View cached map data
- Mark issues for action (synced later)
- View budget data (cached)

---

## 🛠️ Implementation Steps

### Step 1: Install Dependencies

```bash
# For Citizen App
cd apps/citizen-app
npm install workbox-webpack-plugin workbox-window localforage dexie
npm install @capacitor/network @capacitor/storage

# For Official Dashboard
cd apps/official-dashboard
npm install workbox-webpack-plugin workbox-window localforage dexie
```

### Step 2: Configure Service Worker

Create `apps/citizen-app/public/sw.js`:

```javascript
// Service Worker for Offline Support
const CACHE_NAME = 'winguard-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch with Cache-First Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate and Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### Step 3: Create Offline Database Manager

Create `apps/citizen-app/src/utils/offlineDB.ts`:

```typescript
import Dexie, { Table } from 'dexie';

export interface OfflineReport {
  id?: number;
  category: string;
  severity: number;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string; // Base64 encoded
  timestamp: number;
  synced: boolean;
}

export class OfflineDatabase extends Dexie {
  reports!: Table<OfflineReport>;

  constructor() {
    super('WinGuardOfflineDB');
    this.version(1).stores({
      reports: '++id, category, timestamp, synced'
    });
  }
}

export const db = new OfflineDatabase();
```

### Step 4: Create Sync Manager

Create `apps/citizen-app/src/utils/syncManager.ts`:

```typescript
import { db, OfflineReport } from './offlineDB';

export class SyncManager {
  private syncInProgress = false;

  async syncReports() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      // Get all unsynced reports
      const unsyncedReports = await db.reports
        .where('synced')
        .equals(false)
        .toArray();

      console.log(`Syncing ${unsyncedReports.length} reports...`);

      for (const report of unsyncedReports) {
        try {
          // Send to server
          const response = await fetch('http://localhost:3000/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              category: report.category,
              severity: report.severity,
              description: report.description,
              latitude: report.latitude,
              longitude: report.longitude,
              photo: report.photo
            })
          });

          if (response.ok) {
            // Mark as synced
            await db.reports.update(report.id!, { synced: true });
            console.log(`Report ${report.id} synced successfully`);
          }
        } catch (error) {
          console.error(`Failed to sync report ${report.id}:`, error);
        }
      }

      console.log('Sync completed');
    } finally {
      this.syncInProgress = false;
    }
  }

  async saveReportOffline(report: Omit<OfflineReport, 'id' | 'timestamp' | 'synced'>) {
    const offlineReport: OfflineReport = {
      ...report,
      timestamp: Date.now(),
      synced: false
    };

    const id = await db.reports.add(offlineReport);
    console.log(`Report saved offline with ID: ${id}`);
    return id;
  }

  async getOfflineReports() {
    return await db.reports.toArray();
  }

  async clearSyncedReports() {
    await db.reports.where('synced').equals(true).delete();
  }
}

export const syncManager = new SyncManager();
```

### Step 5: Create Network Status Hook

Create `apps/citizen-app/src/hooks/useNetworkStatus.ts`:

```typescript
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status
    Network.getStatus().then(status => {
      setIsOnline(status.connected);
    });

    // Listen for network changes
    const handler = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
      
      if (status.connected) {
        console.log('Network connected - triggering sync');
        // Trigger sync when coming online
        import('../utils/syncManager').then(({ syncManager }) => {
          syncManager.syncReports();
        });
      }
    });

    return () => {
      handler.remove();
    };
  }, []);

  return isOnline;
};
```

### Step 6: Update Report Submission Component

Modify `apps/citizen-app/src/pages/ReportPage.tsx`:

```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { syncManager } from '../utils/syncManager';

export default function ReportPage() {
  const isOnline = useNetworkStatus();
  // ... existing code ...

  const handleSubmit = async () => {
    if (isOnline) {
      // Submit directly to server
      try {
        const response = await fetch('http://localhost:3000/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData)
        });
        
        if (response.ok) {
          alert('Report submitted successfully!');
        }
      } catch (error) {
        // If online but request fails, save offline
        await syncManager.saveReportOffline(reportData);
        alert('Saved offline. Will sync when connection is stable.');
      }
    } else {
      // Save offline
      await syncManager.saveReportOffline(reportData);
      alert('You are offline. Report saved and will be submitted when online.');
    }
  };

  return (
    <div>
      {/* Network Status Indicator */}
      <div className={`fixed top-0 left-0 right-0 p-2 text-center text-white ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {isOnline ? '🟢 Online' : '🔴 Offline - Reports will sync when online'}
      </div>
      
      {/* Rest of your form */}
    </div>
  );
}
```

### Step 7: Add Offline Map Tiles

Create `apps/citizen-app/src/utils/offlineMap.ts`:

```typescript
import L from 'leaflet';

export const getOfflineMapConfig = () => {
  return {
    // Use offline-capable tile layer
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    
    // Cache tiles for offline use
    useCache: true,
    crossOrigin: true,
    
    // Fallback to cached tiles when offline
    errorTileUrl: '/assets/offline-tile.png'
  };
};

// Cache map tiles
export const cacheMapTiles = async (bounds: L.LatLngBounds, zoom: number) => {
  const cache = await caches.open('map-tiles-v1');
  
  // Calculate tile coordinates
  const tiles = getTileCoordinates(bounds, zoom);
  
  for (const tile of tiles) {
    const url = `https://a.tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`;
    try {
      const response = await fetch(url);
      await cache.put(url, response);
    } catch (error) {
      console.error('Failed to cache tile:', error);
    }
  }
};

function getTileCoordinates(bounds: L.LatLngBounds, zoom: number) {
  // Convert lat/lng bounds to tile coordinates
  const tiles = [];
  const nw = bounds.getNorthWest();
  const se = bounds.getSouthEast();
  
  const nwTile = latLngToTile(nw.lat, nw.lng, zoom);
  const seTile = latLngToTile(se.lat, se.lng, zoom);
  
  for (let x = nwTile.x; x <= seTile.x; x++) {
    for (let y = nwTile.y; y <= seTile.y; y++) {
      tiles.push({ x, y });
    }
  }
  
  return tiles;
}

function latLngToTile(lat: number, lng: number, zoom: number) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
}
```

### Step 8: Register Service Worker

Update `apps/citizen-app/src/index.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

---

## 📱 Mobile App Setup (Capacitor)

### Step 1: Initialize Capacitor (if not already done)

```bash
cd apps/citizen-app

# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Initialize Capacitor
npx cap init
# App name: WinGuard
# Package ID: com.winguard.app

# Add platforms
npx cap add android
npx cap add ios
```

### Step 2: Configure Capacitor

Update `apps/citizen-app/capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winguard.app',
  appName: 'WinGuard',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For development, allow localhost
    allowNavigation: ['localhost:3000']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#00658f',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    Network: {
      // Network plugin configuration
    },
    Storage: {
      // Storage plugin configuration
    }
  }
};

export default config;
```

### Step 3: Build and Run Mobile App

```bash
# Build the web app
npm run build

# Copy web assets to native projects
npx cap copy

# Open in Android Studio
npx cap open android

# Or open in Xcode (Mac only)
npx cap open ios

# For live reload during development
npx cap run android -l --external
```

---

## 🌐 Web Dashboard Setup

### Step 1: Build Dashboard for Web

```bash
cd apps/official-dashboard

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in 'dist' folder
```

### Step 2: Serve Dashboard

**Option 1: Using a simple HTTP server**
```bash
# Install serve globally
npm install -g serve

# Serve the built dashboard
cd dist
serve -s . -p 3001

# Dashboard will be available at http://localhost:3001
```

**Option 2: Using Nginx**
```nginx
server {
    listen 80;
    server_name dashboard.winguard.local;
    
    root /path/to/apps/official-dashboard/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Option 3: Using Node.js Express**
```javascript
// server-dashboard.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
```

---

## 🔄 Sync Strategy

### Automatic Sync

```typescript
// apps/citizen-app/src/App.tsx
import { useEffect } from 'react';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { syncManager } from './utils/syncManager';

function App() {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      // Sync when app starts and is online
      syncManager.syncReports();
      
      // Set up periodic sync (every 5 minutes)
      const interval = setInterval(() => {
        syncManager.syncReports();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  return (
    // Your app components
  );
}
```

### Manual Sync Button

```typescript
// Add to your UI
<button
  onClick={() => syncManager.syncReports()}
  disabled={!isOnline}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  {isOnline ? 'Sync Now' : 'Offline - Cannot Sync'}
</button>
```

---

## 📊 Offline Data Management

### Storage Limits

- **IndexedDB:** ~50MB - 100MB (varies by browser)
- **Cache API:** ~50MB - 100MB
- **LocalStorage:** ~5-10MB

### Data Cleanup Strategy

```typescript
// Clean up old synced data
export const cleanupOldData = async () => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  await db.reports
    .where('synced').equals(true)
    .and(report => report.timestamp < thirtyDaysAgo)
    .delete();
};

// Run cleanup periodically
setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Daily
```

---

## 🧪 Testing Offline Functionality

### Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to "Network" tab
3. Select "Offline" from throttling dropdown
4. Test app functionality

### Testing Checklist

- [ ] App loads when offline
- [ ] Can view cached data
- [ ] Can create new reports offline
- [ ] Reports saved to IndexedDB
- [ ] Network status indicator shows correctly
- [ ] Auto-sync triggers when online
- [ ] Manual sync button works
- [ ] Map tiles load from cache
- [ ] Photos saved locally

---

## 🚀 Quick Start Commands

### Start Everything

```bash
# Terminal 1: Start Backend API
cd server
npm run dev

# Terminal 2: Start Official Dashboard (Web)
cd apps/official-dashboard
npm run dev
# Access at http://localhost:5173

# Terminal 3: Start Citizen App (Web for testing)
cd apps/citizen-app
npm run dev
# Access at http://localhost:5174

# Terminal 4: Run Citizen App on Android
cd apps/citizen-app
npm run build
npx cap copy
npx cap run android -l --external
```

---

## 📱 Mobile App Distribution

### Android APK

```bash
cd apps/citizen-app

# Build release APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### iOS App

```bash
cd apps/citizen-app

# Open in Xcode
npx cap open ios

# Build in Xcode:
# Product > Archive > Distribute App
```

---

## 🎯 Summary

✅ **Offline Functionality:**
- Service Worker for caching
- IndexedDB for local storage
- Auto-sync when online
- Network status detection

✅ **Mobile App:**
- Capacitor for native features
- Android and iOS support
- Camera and GPS access
- Push notifications ready

✅ **Web Dashboard:**
- Runs on any web server
- Responsive design
- Real-time updates
- Offline caching

---

## 📞 Support

For issues:
1. Check browser console for errors
2. Verify Service Worker registration
3. Check IndexedDB in DevTools
4. Test network status detection

---

**Offline functionality is now ready! 🎉**

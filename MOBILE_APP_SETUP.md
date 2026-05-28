# 📱 WinGuard Mobile App Setup Guide

## Complete Guide to Running Citizen App on Android

---

## 🎯 Overview

This guide will help you:
1. Set up the development environment
2. Build the WinGuard Citizen App
3. Run it on your Android device
4. Enable offline functionality
5. Create an installable APK

---

## 📋 Prerequisites

### Required Software

1. **Node.js 16+**
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Android Studio**
   - Download: https://developer.android.com/studio
   - Install with Android SDK

3. **Java JDK 11+**
   - Download: https://www.oracle.com/java/technologies/downloads/
   - Or use OpenJDK: https://adoptium.net/
   - Verify: `java --version`

4. **Git** (optional but recommended)
   - Download: https://git-scm.com/

### Android Device or Emulator

**Option 1: Physical Device**
- Android 5.0 (Lollipop) or higher
- USB cable
- USB debugging enabled

**Option 2: Android Emulator**
- Created in Android Studio
- Recommended: Pixel 5 with Android 11+

---

## 🚀 Step-by-Step Setup

### Step 1: Install Capacitor

```bash
cd apps/citizen-app

# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npm install @capacitor/camera @capacitor/geolocation @capacitor/network @capacitor/storage
```

### Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App name:** WinGuard
- **Package ID:** com.winguard.app
- **Web asset directory:** dist

This creates `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winguard.app',
  appName: 'WinGuard',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

### Step 3: Add Android Platform

```bash
npx cap add android
```

This creates the `android` folder with the native Android project.

### Step 4: Configure Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.winguard.app">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>
    </application>

</manifest>
```

### Step 5: Build the Web App

```bash
# Make sure you're in apps/citizen-app
npm run build
```

This creates the `dist` folder with your built web app.

### Step 6: Copy Web Assets to Android

```bash
npx cap copy android
```

This copies the `dist` folder contents to the Android project.

### Step 7: Open in Android Studio

```bash
npx cap open android
```

Android Studio will open with your project.

---

## 🔧 Android Studio Setup

### First Time Setup

1. **Wait for Gradle Sync**
   - Android Studio will automatically sync Gradle
   - This may take 5-10 minutes the first time
   - Wait for "Gradle sync finished" message

2. **Install Missing Components**
   - If prompted, install any missing SDK components
   - Accept licenses if asked

3. **Configure SDK**
   - Go to: File > Project Structure > SDK Location
   - Ensure Android SDK is properly configured
   - Recommended SDK: Android 11 (API 30) or higher

### Set Up Android Device

**Physical Device:**

1. **Enable Developer Mode:**
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go to Settings > Developer Options
   - Enable "USB Debugging"
   - Connect device via USB
   - Allow USB debugging when prompted

3. **Verify Connection:**
   - In Android Studio, check device dropdown
   - Your device should appear

**Emulator:**

1. **Create Emulator:**
   - Tools > Device Manager
   - Click "Create Device"
   - Select: Pixel 5
   - System Image: Android 11 (API 30)
   - Click "Finish"

2. **Start Emulator:**
   - Click the play button next to your emulator
   - Wait for it to boot up

---

## ▶️ Running the App

### Method 1: Run from Android Studio

1. Select your device/emulator from dropdown
2. Click the green "Run" button (▶️)
3. Wait for app to build and install
4. App will launch automatically

### Method 2: Run with Live Reload (Development)

```bash
cd apps/citizen-app

# Build and run with live reload
npm run build
npx cap copy
npx cap run android -l --external
```

This enables:
- ✅ Live reload when you make changes
- ✅ Automatic app refresh
- ✅ Faster development

### Method 3: Command Line Only

```bash
cd apps/citizen-app/android

# Windows
gradlew.bat installDebug

# Mac/Linux
./gradlew installDebug
```

---

## 📦 Building Release APK

### Step 1: Build Release

```bash
cd apps/citizen-app/android

# Windows
gradlew.bat assembleRelease

# Mac/Linux
./gradlew assembleRelease
```

### Step 2: Find the APK

The APK will be at:
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Step 3: Sign the APK (Optional for Testing)

For testing, you can use the unsigned APK. For production, you need to sign it.

**Generate Keystore:**
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Sign APK:**
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk my-key-alias
```

### Step 4: Install APK on Device

**Method 1: USB Transfer**
```bash
adb install android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**Method 2: Manual Transfer**
1. Copy APK to your phone (email, USB, cloud)
2. Open APK file on phone
3. Allow "Install from Unknown Sources"
4. Tap "Install"

---

## 🔌 Offline Functionality Setup

### Step 1: Install Offline Dependencies

```bash
cd apps/citizen-app

npm install dexie
npm install workbox-webpack-plugin workbox-window
npm install @capacitor/network @capacitor/storage
```

### Step 2: Create Offline Database

Create `src/utils/offlineDB.ts`:

```typescript
import Dexie, { Table } from 'dexie';

export interface OfflineReport {
  id?: number;
  category: string;
  severity: number;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string;
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

### Step 3: Create Sync Manager

Create `src/utils/syncManager.ts`:

```typescript
import { db, OfflineReport } from './offlineDB';

export class SyncManager {
  async syncReports() {
    const unsyncedReports = await db.reports
      .where('synced')
      .equals(false)
      .toArray();

    for (const report of unsyncedReports) {
      try {
        const response = await fetch('http://your-api-url/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });

        if (response.ok) {
          await db.reports.update(report.id!, { synced: true });
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }

  async saveReportOffline(report: Omit<OfflineReport, 'id' | 'timestamp' | 'synced'>) {
    return await db.reports.add({
      ...report,
      timestamp: Date.now(),
      synced: false
    });
  }
}

export const syncManager = new SyncManager();
```

### Step 4: Use Network Status Hook

Create `src/hooks/useNetworkStatus.ts`:

```typescript
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    Network.getStatus().then(status => {
      setIsOnline(status.connected);
    });

    const handler = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    return () => handler.remove();
  }, []);

  return isOnline;
};
```

### Step 5: Update Report Submission

In your report submission component:

```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { syncManager } from '../utils/syncManager';

const isOnline = useNetworkStatus();

const handleSubmit = async () => {
  if (isOnline) {
    // Submit to server
    try {
      await fetch('/api/reports', { /* ... */ });
    } catch (error) {
      // Save offline if request fails
      await syncManager.saveReportOffline(reportData);
    }
  } else {
    // Save offline
    await syncManager.saveReportOffline(reportData);
    alert('Saved offline. Will sync when online.');
  }
};
```

---

## 🧪 Testing

### Test on Device

1. **Install App:**
   - Run from Android Studio or install APK

2. **Test Features:**
   - [ ] App opens successfully
   - [ ] Can take photos
   - [ ] GPS location works
   - [ ] Can submit reports
   - [ ] Map displays correctly
   - [ ] Offline mode works

3. **Test Offline:**
   - Enable Airplane mode
   - Try to submit a report
   - Should save locally
   - Disable Airplane mode
   - Report should sync automatically

### Debug on Device

1. **View Logs:**
   - In Android Studio: View > Tool Windows > Logcat
   - Filter by package: com.winguard.app

2. **Chrome DevTools:**
   - Open Chrome on computer
   - Go to: chrome://inspect
   - Select your device
   - Click "Inspect"

---

## 🎨 Customization

### Change App Icon

1. **Prepare Icons:**
   - Create icons in various sizes
   - Use: https://icon.kitchen/

2. **Replace Icons:**
   - Place in: `android/app/src/main/res/`
   - Folders: mipmap-hdpi, mipmap-mdpi, mipmap-xhdpi, etc.

3. **Update:**
   ```bash
   npx cap copy android
   ```

### Change App Name

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">WinGuard</string>
    <string name="title_activity_main">WinGuard</string>
</resources>
```

### Change Splash Screen

1. **Create Splash Image:**
   - Size: 2732x2732 px
   - Format: PNG with transparency

2. **Place in:**
   - `android/app/src/main/res/drawable/splash.png`

3. **Configure:**
   Edit `capacitor.config.ts`:
   ```typescript
   plugins: {
     SplashScreen: {
       launchShowDuration: 2000,
       backgroundColor: "#00658f",
       showSpinner: true
     }
   }
   ```

---

## 🐛 Troubleshooting

### Common Issues

**1. Gradle Build Failed**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew build
```

**2. App Crashes on Launch**
- Check Logcat for errors
- Verify all permissions in AndroidManifest.xml
- Ensure all Capacitor plugins are installed

**3. Camera Not Working**
- Check camera permission in AndroidManifest.xml
- Request permission at runtime
- Test on physical device (emulator camera may not work)

**4. GPS Not Working**
- Check location permissions
- Enable location services on device
- Test outdoors for better GPS signal

**5. Cannot Connect to API**
- Check network permission
- Use `http://10.0.2.2:3000` for emulator (localhost)
- Use your computer's IP for physical device
- Ensure `usesCleartextTraffic="true"` in manifest

### Getting Help

1. **Check Logs:**
   ```bash
   adb logcat | grep WinGuard
   ```

2. **Capacitor Doctor:**
   ```bash
   npx cap doctor
   ```

3. **Rebuild:**
   ```bash
   npm run build
   npx cap copy
   npx cap sync
   ```

---

## 📊 Performance Tips

1. **Optimize Images:**
   - Compress photos before upload
   - Use WebP format
   - Resize to max 1920x1080

2. **Lazy Load:**
   - Load map tiles on demand
   - Lazy load images
   - Use virtual scrolling for lists

3. **Cache Data:**
   - Cache API responses
   - Store frequently accessed data locally
   - Use IndexedDB for large datasets

---

## 🚀 Distribution

### Google Play Store

1. **Create Signed APK:**
   - Generate keystore
   - Sign APK
   - Align APK with zipalign

2. **Create Developer Account:**
   - https://play.google.com/console
   - Pay $25 one-time fee

3. **Upload APK:**
   - Create app listing
   - Upload signed APK
   - Fill in store details
   - Submit for review

### Direct Distribution

1. **Build Release APK**
2. **Host on website or cloud storage**
3. **Share download link**
4. **Users install manually**

---

## ✅ Checklist

Before releasing:

- [ ] All features tested
- [ ] Offline mode works
- [ ] Camera works
- [ ] GPS works
- [ ] No crashes
- [ ] Proper error handling
- [ ] Loading states
- [ ] User feedback messages
- [ ] App icon set
- [ ] Splash screen configured
- [ ] Permissions requested properly
- [ ] API endpoints configured
- [ ] Signed APK created
- [ ] Tested on multiple devices

---

## 🎉 You're Done!

Your WinGuard mobile app is now ready!

**Next Steps:**
1. Test thoroughly on device
2. Get user feedback
3. Fix any issues
4. Prepare for distribution

**For more help:**
- See RUN_INSTRUCTIONS.md
- See OFFLINE_SETUP.md
- Check Capacitor docs: https://capacitorjs.com/

---

**Happy Mobile Development! 📱**

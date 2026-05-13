# WinGuard Citizen App - Mobile APK Build Guide

## 📱 Overview
This guide will help you build an Android APK from the WinGuard Citizen web app using Capacitor.

---

## ✅ Prerequisites

### 1. **Install Android Studio**
- Download from: https://developer.android.com/studio
- Install Android Studio with default settings
- Open Android Studio and complete the setup wizard

### 2. **Install Java Development Kit (JDK)**
- Download JDK 17 or later: https://www.oracle.com/java/technologies/downloads/
- Set JAVA_HOME environment variable:
  ```bash
  # Windows (PowerShell)
  [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-17', 'Machine')
  
  # Add to PATH
  [System.Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';%JAVA_HOME%\bin', 'Machine')
  ```

### 3. **Configure Android SDK**
- Open Android Studio
- Go to: **Tools → SDK Manager**
- Install:
  - ✅ Android SDK Platform 33 (or latest)
  - ✅ Android SDK Build-Tools
  - ✅ Android SDK Command-line Tools
  - ✅ Android Emulator (optional, for testing)

### 4. **Set Environment Variables**
```bash
# Windows (PowerShell - Run as Administrator)
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\YourUsername\AppData\Local\Android\Sdk', 'Machine')
[System.Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin', 'Machine')
```

**Verify Installation:**
```bash
java -version
adb version
```

---

## 🚀 Building the APK

### Step 1: Build the Web App
```bash
cd apps/citizen-app
npm run build
```

### Step 2: Sync with Capacitor
```bash
npm run cap:sync
```
This copies the built web assets to the Android project.

### Step 3: Open in Android Studio
```bash
npm run cap:open:android
```
Or manually:
```bash
npx cap open android
```

### Step 4: Build APK in Android Studio

#### Option A: Debug APK (Quick Build)
1. In Android Studio, click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for the build to complete
3. Click **locate** in the notification to find the APK
4. APK location: `apps/citizen-app/android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Release APK (Production)
1. **Generate Signing Key** (first time only):
   ```bash
   keytool -genkey -v -keystore winguard-release-key.keystore -alias winguard -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Save the keystore file in a secure location
   - Remember the passwords!

2. **Configure Signing in Android Studio:**
   - Go to **Build → Generate Signed Bundle / APK**
   - Select **APK**
   - Choose your keystore file
   - Enter passwords
   - Select **release** build variant
   - Click **Finish**

3. **APK Location:**
   - `apps/citizen-app/android/app/build/outputs/apk/release/app-release.apk`

---

## 📦 Quick Build Commands

### Build and Open Android Studio
```bash
cd apps/citizen-app
npm run android:build
```

### Build Only (No Android Studio)
```bash
cd apps/citizen-app
npm run build:mobile
```

### Sync Changes After Code Updates
```bash
cd apps/citizen-app
npm run build
npm run cap:sync
```

---

## 🔧 Configuration Files

### `capacitor.config.ts`
Located at: `apps/citizen-app/capacitor.config.ts`

Key configurations:
- **appId**: `com.winguard.citizen` (unique package identifier)
- **appName**: `WinGuard` (app name shown on device)
- **webDir**: `dist` (build output directory)
- **server.allowNavigation**: Allows external API calls
- **android.allowMixedContent**: Enables HTTP requests (for development)

### `android/app/build.gradle`
Located at: `apps/citizen-app/android/app/build.gradle`

Key settings:
- **applicationId**: Must match `appId` in capacitor.config.ts
- **versionCode**: Increment for each release (1, 2, 3...)
- **versionName**: User-facing version (1.0.0, 1.0.1...)
- **minSdkVersion**: Minimum Android version (usually 22 = Android 5.1)
- **targetSdkVersion**: Target Android version (usually 33 = Android 13)

---

## 📱 Testing the APK

### Install on Physical Device
1. Enable **Developer Options** on your Android device:
   - Go to **Settings → About Phone**
   - Tap **Build Number** 7 times
2. Enable **USB Debugging**:
   - Go to **Settings → Developer Options**
   - Enable **USB Debugging**
3. Connect device via USB
4. Install APK:
   ```bash
   adb install apps/citizen-app/android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Install via File Transfer
1. Copy APK to your phone
2. Open the APK file on your phone
3. Allow installation from unknown sources if prompted
4. Install the app

### Test on Emulator
1. Open Android Studio
2. Click **Device Manager** (phone icon)
3. Create a new virtual device
4. Run the app: **Run → Run 'app'**

---

## 🎨 Customizing the App

### App Icon
1. Create icons in different sizes:
   - `mipmap-mdpi`: 48x48
   - `mipmap-hdpi`: 72x72
   - `mipmap-xhdpi`: 96x96
   - `mipmap-xxhdpi`: 144x144
   - `mipmap-xxxhdpi`: 192x192

2. Replace icons in:
   ```
   apps/citizen-app/android/app/src/main/res/
   ├── mipmap-hdpi/ic_launcher.png
   ├── mipmap-mdpi/ic_launcher.png
   ├── mipmap-xhdpi/ic_launcher.png
   ├── mipmap-xxhdpi/ic_launcher.png
   └── mipmap-xxxhdpi/ic_launcher.png
   ```

### App Name
Edit: `apps/citizen-app/android/app/src/main/res/values/strings.xml`
```xml
<resources>
    <string name="app_name">WinGuard</string>
    <string name="title_activity_main">WinGuard</string>
</resources>
```

### Splash Screen
- Background color is set in `capacitor.config.ts`:
  ```typescript
  SplashScreen: {
    backgroundColor: '#14b8a6', // Cyan-green (Win color)
  }
  ```

### Permissions
Edit: `apps/citizen-app/android/app/src/main/AndroidManifest.xml`

Current permissions:
- ✅ `ACCESS_FINE_LOCATION` - GPS tracking
- ✅ `ACCESS_COARSE_LOCATION` - Network location
- ✅ `CAMERA` - Photo capture
- ✅ `READ_EXTERNAL_STORAGE` - Photo selection
- ✅ `WRITE_EXTERNAL_STORAGE` - Photo storage
- ✅ `INTERNET` - API calls

---

## 🐛 Troubleshooting

### Build Fails: "SDK location not found"
**Solution:** Set ANDROID_HOME environment variable (see Prerequisites)

### Build Fails: "Java version incompatible"
**Solution:** Install JDK 17 or later and set JAVA_HOME

### App Crashes on Launch
**Solution:** Check logs:
```bash
adb logcat | grep -i winguard
```

### Location Not Working
**Solution:** 
1. Check permissions in AndroidManifest.xml
2. Enable location on device
3. Grant location permission to app

### API Calls Failing
**Solution:**
1. Update `server.allowNavigation` in capacitor.config.ts
2. Set `android.allowMixedContent: true` for HTTP (development only)
3. For production, use HTTPS

### White Screen on Launch
**Solution:**
1. Rebuild: `npm run build`
2. Sync: `npm run cap:sync`
3. Clear cache in Android Studio: **Build → Clean Project**

---

## 📊 Build Variants

### Debug Build
- **Purpose**: Development and testing
- **Signing**: Auto-signed with debug key
- **Size**: Larger (includes debug symbols)
- **Performance**: Slower
- **Command**: `Build → Build APK(s)`

### Release Build
- **Purpose**: Production distribution
- **Signing**: Requires release keystore
- **Size**: Smaller (optimized)
- **Performance**: Faster
- **Command**: `Build → Generate Signed Bundle / APK`

---

## 🚀 Distribution

### Google Play Store
1. Create a Google Play Developer account ($25 one-time fee)
2. Build a signed release APK or AAB (Android App Bundle)
3. Upload to Play Console
4. Fill in store listing details
5. Submit for review

### Direct Distribution
1. Build signed release APK
2. Host on your website
3. Users download and install
4. Note: Users must enable "Install from Unknown Sources"

---

## 📝 Version Management

### Update Version
Edit: `apps/citizen-app/android/app/build.gradle`

```gradle
android {
    defaultConfig {
        versionCode 2        // Increment for each release
        versionName "1.0.1"  // User-facing version
    }
}
```

### Rebuild After Updates
```bash
cd apps/citizen-app
npm run build
npm run cap:sync
npm run cap:open:android
```

---

## 🎯 Mobile-Specific Features

### Features Enabled
✅ GPS location tracking
✅ Camera access for photo reports
✅ Offline map caching (PWA)
✅ Push notifications (ready)
✅ Background location (ready)
✅ File system access

### Mobile Optimizations
✅ Touch-optimized UI (44px minimum touch targets)
✅ Responsive layout for all screen sizes
✅ Safe area insets for notched devices
✅ Hardware back button support
✅ Splash screen
✅ Status bar styling

---

## 📞 Support

### Useful Commands
```bash
# Check connected devices
adb devices

# View app logs
adb logcat

# Uninstall app
adb uninstall com.winguard.citizen

# Clear app data
adb shell pm clear com.winguard.citizen

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

### Resources
- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio/intro
- Capacitor Android: https://capacitorjs.com/docs/android

---

## ✅ Final Checklist

Before releasing:
- [ ] Test on multiple Android versions
- [ ] Test on different screen sizes
- [ ] Verify all permissions work
- [ ] Test offline functionality
- [ ] Check GPS accuracy
- [ ] Test camera and photo upload
- [ ] Verify API connectivity
- [ ] Test navigation features
- [ ] Check performance
- [ ] Update version numbers
- [ ] Generate signed release APK
- [ ] Test release APK on device

---

**Your APK is ready! 🎉**

The debug APK is located at:
`apps/citizen-app/android/app/build/outputs/apk/debug/app-debug.apk`

Install it on your Android device and start testing!

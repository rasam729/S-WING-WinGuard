import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.winguard.citizen',
  appName: 'WinGuard',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['localhost', '172.17.0.79', '*.openstreetmap.org', 'nominatim.openstreetmap.org']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#14b8a6',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#ffffff'
    },
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;

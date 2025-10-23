import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safehaven.emergency',
  appName: 'SafeHaven',
  webDir: 'build',
  server: {
    // For development with live reload (optional)
    // url: 'http://192.168.1.X:3004',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FF69B4",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    },
    Geolocation: {
      // Request precise location
      enableHighAccuracy: true
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;

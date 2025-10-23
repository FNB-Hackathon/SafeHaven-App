# SafeHaven Mobile App Build Guide

Your SafeHaven app is now ready to build for **Android** and **iOS**!

## ✅ Setup Complete

- ✅ Capacitor core installed
- ✅ Android platform added (`frontend/android/`)
- ✅ iOS platform added (`frontend/ios/`)
- ✅ Native plugins installed:
  - `@capacitor/geolocation` - Better GPS accuracy
  - `@capacitor/motion` - Shake detection
  - `@capacitor/browser` - Opening WhatsApp links
  - `@capacitor/app` - App lifecycle

## 📱 Build for Android (APK)

### Prerequisites
- **Android Studio** installed ([Download here](https://developer.android.com/studio))
- Java JDK 17 or higher

### Steps

1. **Open Android project:**
   ```bash
   cd frontend
   npx cap open android
   ```

2. **In Android Studio:**
   - Wait for Gradle sync to complete
   - If Gradle errors appear, update Gradle wrapper:
     - File → Project Structure → Project → Gradle Version: 8.11.1
     - Or update Java to JDK 17+

3. **Build APK:**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK will be in: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

4. **Install on device:**
   - Connect Android phone via USB (enable USB debugging)
   - Run → Run 'app' in Android Studio
   - Or drag `app-debug.apk` to phone and install

### Build Release APK (for distribution)

1. **Generate signing key:**
   ```bash
   keytool -genkey -v -keystore safehaven-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias safehaven
   ```

2. **In Android Studio:**
   - Build → Generate Signed Bundle / APK
   - Choose APK → Next
   - Select key store and fill in passwords
   - Build release APK

## 🍎 Build for iOS (IPA)

### Prerequisites
- **macOS** with **Xcode** installed ([Download from Mac App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **Apple Developer Account** ($99/year for App Store)

### Steps

1. **Open iOS project:**
   ```bash
   cd frontend
   npx cap open ios
   ```

2. **In Xcode:**
   - Select "SafeHaven" project in navigator
   - Select "SafeHaven" target
   - Update **Bundle Identifier**: `com.safehaven.app` (or your custom)
   - Update **Team**: Select your Apple Developer account

3. **Configure signing:**
   - Signing & Capabilities → Automatically manage signing (check)
   - Team → Select your Apple Developer team

4. **Add required permissions:**
   Xcode will prompt or you can manually add to `Info.plist`:
   - Already added: Location, Motion permissions

5. **Build for testing:**
   - Select your iPhone from device list
   - Product → Run (⌘R)
   - App installs on connected iPhone

6. **Build for App Store:**
   - Product → Archive
   - Upload to App Store Connect
   - Submit for TestFlight or review

## 🔄 Update App After Code Changes

Whenever you change React code:

```bash
cd frontend

# 1. Build React app
npm run build

# 2. Sync to native projects
npx cap sync

# 3. (Optional) Open in IDE to rebuild
npx cap open android   # or
npx cap open ios
```

## 📋 Permissions Already Configured

### Android (`android/app/src/main/AndroidManifest.xml`)
- ✅ `ACCESS_FINE_LOCATION`
- ✅ `ACCESS_COARSE_LOCATION`
- ✅ `INTERNET`
- ✅ `VIBRATE`

### iOS (`ios/App/App/Info.plist`)
- ✅ `NSLocationWhenInUseUsageDescription`
- ✅ `NSMotionUsageDescription`

## 🎯 App Features Working Natively

- ✅ **Precise GPS** - Uses device GPS hardware
- ✅ **Shake detection** - Native accelerometer
- ✅ **WhatsApp deep links** - Opens WhatsApp app directly
- ✅ **Background location** (when app is open)
- ✅ **Vibration feedback**
- ✅ **Push notifications** (can add later)

## 🐛 Troubleshooting

### Android: Gradle sync failed
- Update Java to JDK 17+
- Update Android Studio to latest
- In Android Studio: File → Invalidate Caches → Invalidate and Restart

### iOS: Code signing error
- Select valid Apple Developer team
- Update Bundle ID to unique identifier
- Ensure provisioning profile is active

### App crashes on device
- Check permissions are granted (Location, Motion)
- Open device Settings → SafeHaven → Permissions
- Check browser console in dev mode: `npx cap run android --livereload`

## 📦 Distribution

### Android
- **Google Play Store**: Build release APK/AAB, upload to Play Console
- **Direct install**: Share `app-debug.apk` or `app-release.apk` file

### iOS
- **App Store**: Archive → Upload to App Store Connect → Submit
- **TestFlight**: Upload to TestFlight for beta testing
- **Ad Hoc**: Create ad-hoc provisioning profile for direct install

## 🚀 Next Steps

1. Test on real devices (Android + iPhone)
2. Update app icons and splash screens
3. Configure backend URL for production
4. Add push notifications (optional)
5. Submit to app stores

## 📱 Test Devices

Your app should work on:
- Android 7.0+ (API 24+)
- iOS 13.0+

---

**Need help?** Check [Capacitor docs](https://capacitorjs.com/docs) or reach out!

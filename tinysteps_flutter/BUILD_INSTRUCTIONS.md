# TinySteps AI - Build Instructions

This document provides step-by-step instructions for building the TinySteps AI app for Android (APK) and iOS.

## Prerequisites

### 1. Install Flutter

```bash
# Download Flutter SDK
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# Verify installation
flutter doctor
```

Or follow the official guide: https://docs.flutter.dev/get-started/install

### 2. Install Development Tools

**For Android:**
- Android Studio (https://developer.android.com/studio)
- Android SDK (install via Android Studio)
- Java JDK 17+

**For iOS (Mac only):**
- Xcode 15+ (from App Store)
- CocoaPods (`sudo gem install cocoapods`)

## Project Setup

### 1. Navigate to the project directory

```bash
cd tinysteps_flutter
```

### 2. Install dependencies

```bash
flutter pub get
```

### 3. Verify setup

```bash
flutter doctor -v
```

Make sure all checkmarks are green for the platform you want to build.

## Building for Android (APK)

### Option 1: Debug APK (for testing)

```bash
flutter build apk --debug
```

The APK will be at: `build/app/outputs/flutter-apk/app-debug.apk`

### Option 2: Release APK (for distribution)

```bash
flutter build apk --release
```

The APK will be at: `build/app/outputs/flutter-apk/app-release.apk`

### Option 3: Split APKs by architecture (smaller file sizes)

```bash
flutter build apk --split-per-abi --release
```

This creates multiple APKs:
- `app-arm64-v8a-release.apk` (most modern phones)
- `app-armeabi-v7a-release.apk` (older phones)
- `app-x86_64-release.apk` (emulators)

### Option 4: App Bundle (for Google Play Store)

```bash
flutter build appbundle --release
```

The bundle will be at: `build/app/outputs/bundle/release/app-release.aab`

### Install APK on connected device

```bash
flutter install
```

Or manually:
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

## Building for iOS (Mac required)

### 1. Install iOS dependencies

```bash
cd ios
pod install
cd ..
```

### 2. Open in Xcode (recommended for first build)

```bash
open ios/Runner.xcworkspace
```

In Xcode:
1. Select your development team under Signing & Capabilities
2. Change the Bundle Identifier if needed (e.g., `com.yourname.tinystepsai`)
3. Select your target device

### 3. Build IPA for testing

```bash
flutter build ios --release
```

### 4. Create IPA for distribution

```bash
flutter build ipa --release
```

The IPA will be at: `build/ios/ipa/TinySteps AI.ipa`

### 5. Install on device via Xcode

1. Connect your iPhone
2. In Xcode, select your device
3. Product > Run (or press Cmd+R)

## Signing Configuration

### Android Signing (for release builds)

1. Generate a keystore:
```bash
keytool -genkey -v -keystore ~/tinysteps-key.jks -keyalias tinysteps -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/key.properties`:
```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=tinysteps
storeFile=/path/to/tinysteps-key.jks
```

3. Update `android/app/build.gradle` to use the keystore:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### iOS Signing (requires Apple Developer Account)

1. Create an Apple Developer account ($99/year)
2. In Xcode, sign in with your Apple ID
3. Select your team under Signing & Capabilities
4. Xcode will automatically create provisioning profiles

## Common Issues & Solutions

### Android

**Issue:** "SDK location not found"
```bash
# Create local.properties in android folder
echo "sdk.dir=/path/to/android/sdk" > android/local.properties
```

**Issue:** "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter build apk
```

### iOS

**Issue:** "No provisioning profile"
- Open Xcode, sign in with Apple ID
- Enable "Automatically manage signing"
- Select your development team

**Issue:** "CocoaPods not installed"
```bash
sudo gem install cocoapods
cd ios
pod install
```

## Testing the App

### On Android Emulator

```bash
# List available emulators
flutter emulators

# Launch emulator
flutter emulators --launch <emulator_id>

# Run app
flutter run
```

### On iOS Simulator (Mac only)

```bash
# Open simulator
open -a Simulator

# Run app
flutter run
```

### On Physical Device

1. Enable Developer Mode on your device
2. Connect via USB
3. Run:
```bash
flutter devices  # List connected devices
flutter run -d <device_id>
```

## App Configuration

### Setting up Gemini API Key

1. Get a free API key from: https://aistudio.google.com/app/apikey
2. In the app, go to Profile > Settings
3. Enter your API key

### Customizing the App

**App Name:**
- Android: `android/app/src/main/AndroidManifest.xml` → `android:label`
- iOS: `ios/Runner/Info.plist` → `CFBundleDisplayName`

**App Icon:**
- Replace images in `assets/images/app_icon.png`
- Run: `flutter pub run flutter_launcher_icons`

**Package/Bundle ID:**
- Android: `android/app/build.gradle` → `applicationId`
- iOS: Xcode → Runner → Signing & Capabilities → Bundle Identifier

## File Sizes

Approximate build sizes:
- Debug APK: ~80-100 MB
- Release APK: ~25-35 MB
- Split APKs: ~15-20 MB each
- App Bundle: ~20-30 MB
- iOS IPA: ~40-60 MB

## Distributing Your App

### Android

**Direct APK sharing:**
1. Build release APK
2. Share the APK file
3. Users enable "Install from unknown sources"

**Google Play Store:**
1. Create Google Play Developer account ($25 one-time)
2. Build app bundle (.aab)
3. Upload to Play Console
4. Complete store listing

### iOS

**TestFlight (beta testing):**
1. Archive in Xcode
2. Upload to App Store Connect
3. Add testers via TestFlight

**App Store:**
1. Create App Store Connect account
2. Archive and upload from Xcode
3. Complete app information
4. Submit for review

## Quick Build Commands Reference

```bash
# Clean project
flutter clean && flutter pub get

# Android Debug
flutter build apk --debug

# Android Release
flutter build apk --release

# Android Bundle (Play Store)
flutter build appbundle --release

# iOS Release
flutter build ios --release

# iOS IPA
flutter build ipa --release

# Run on device
flutter run --release
```

## Support

If you encounter issues:
1. Run `flutter doctor -v` to check setup
2. Try `flutter clean && flutter pub get`
3. Check Flutter's official troubleshooting: https://docs.flutter.dev/

---

Happy Building! 🚀

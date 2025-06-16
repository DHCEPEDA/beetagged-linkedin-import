# BeeTagged Android APK Build Guide

## Quick Build for Testing

### 1. Generate Debug APK
```bash
cd android
./gradlew assembleDebug
```

### 2. Generate Release APK
```bash
cd android
./gradlew assembleRelease
```

### 3. Generate Android App Bundle (AAB) for Google Play
```bash
cd android
./gradlew bundleRelease
```

## APK Location
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- Release Bundle: `android/app/build/outputs/bundle/release/app-release.aab`

## Google Play Console Setup

### App Information
- **App Name**: BeeTagged
- **Package Name**: com.beetagged.app
- **Version Code**: 1
- **Version Name**: 1.0.0
- **Category**: Productivity
- **Content Rating**: Everyone

### Store Listing
- **Short Description**: Smart contact management with AI-powered search
- **Full Description**: Transform your professional network with intelligent contact organization, natural language search, and seamless LinkedIn integration.

### App Permissions
- Internet access for syncing data
- Contacts access for contact management
- Camera access for profile photos
- Storage access for import/export

### Testing Instructions
1. Download the APK to your Android device
2. Enable "Install from unknown sources" in Settings
3. Install the APK file
4. Launch BeeTagged
5. Register with any email/password
6. Test search functionality with demo data
7. Try LinkedIn CSV import feature

## Server Configuration
- Production server: https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev
- API endpoints: /api/auth/*, /api/contacts/*, /api/tags/*, /api/search/*
- Demo data included for immediate testing

## Features to Test
- User registration and login
- Contact search with natural language queries
- Tag creation and management
- LinkedIn CSV import
- Social media integration interfaces
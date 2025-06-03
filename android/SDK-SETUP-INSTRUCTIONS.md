# Android SDK Setup Instructions

## Quick Setup Guide

### Option 1: Set ANDROID_HOME Environment Variable (Recommended)

**Windows:**
1. Open System Properties → Advanced → Environment Variables
2. Add new System Variable:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\{YourUsername}\AppData\Local\Android\Sdk`
3. Add to PATH: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools`

**macOS:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

**Linux:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

### Option 2: Set sdk.dir in local.properties

Create or edit `local.properties` file in your project root:

**Windows:**
```
sdk.dir=C\:\\Users\\{YourUsername}\\AppData\\Local\\Android\\Sdk
```

**macOS:**
```
sdk.dir=/Users/{YourUsername}/Library/Android/sdk
```

**Linux:**
```
sdk.dir=/home/{YourUsername}/Android/Sdk
```

## Finding Your Android SDK Path

### Android Studio Method:
1. Open Android Studio
2. File → Settings (Windows/Linux) or Preferences (macOS)
3. Appearance & Behavior → System Settings → Android SDK
4. Copy the "Android SDK Location" path

### Common SDK Locations:

**Windows:**
- `C:\Users\{Username}\AppData\Local\Android\Sdk`
- `C:\Android\Sdk`

**macOS:**
- `/Users/{Username}/Library/Android/sdk`
- `/Applications/Android/sdk`

**Linux:**
- `/home/{Username}/Android/Sdk`
- `/opt/android-sdk`

## Installing Android SDK (If Not Installed)

### Method 1: Install via Android Studio
1. Download Android Studio from https://developer.android.com/studio
2. Run installation wizard
3. SDK will be automatically installed

### Method 2: Command Line Tools Only
1. Download command line tools from https://developer.android.com/studio#command-tools
2. Extract to desired location
3. Set ANDROID_HOME to that location
4. Install required packages:
   ```bash
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   ```

## Verification

After setup, verify by running:
```bash
./gradlew --version
```

You should see Android SDK information in the output.

## Troubleshooting

### Error: "SDK location not found"
- Ensure ANDROID_HOME is set correctly
- Verify the path exists and contains SDK files
- Restart terminal/IDE after setting environment variables

### Error: "No installed build tools found"
```bash
sdkmanager "build-tools;34.0.0"
```

### Error: "Platform not found"
```bash
sdkmanager "platforms;android-34"
```

## Required SDK Components for BeeTagged

Minimum required:
- Platform Tools
- Android 14 (API 34)
- Build Tools 34.0.0
- Android Support Repository
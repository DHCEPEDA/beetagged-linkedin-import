# BeeTagged Android Studio Project Setup

## Method 1: Create New Project in Android Studio

1. **Open Android Studio**
2. **Create New Project**
   - Choose "Empty Activity"
   - Application name: BeeTagged
   - Package name: com.beetagged.app
   - Language: Java
   - Minimum SDK: API 24 (Android 7.0)

3. **Add Capacitor Dependencies**
   Add to `app/build.gradle`:
   ```gradle
   implementation 'com.capacitorjs:core:5.0.0'
   implementation 'com.capacitorjs:android:5.0.0'
   ```

4. **Update AndroidManifest.xml**
   Replace with:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <manifest xmlns:android="http://schemas.android.com/apk/res/android"
       package="com.beetagged.app">

       <uses-permission android:name="android.permission.INTERNET" />
       <uses-permission android:name="android.permission.READ_CONTACTS" />
       <uses-permission android:name="android.permission.WRITE_CONTACTS" />
       <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

       <application
           android:allowBackup="true"
           android:icon="@mipmap/ic_launcher"
           android:label="BeeTagged"
           android:theme="@style/Theme.AppCompat.DayNight.NoActionBar">

           <activity
               android:name=".MainActivity"
               android:exported="true"
               android:label="BeeTagged">
               <intent-filter>
                   <action android:name="android.intent.action.MAIN" />
                   <category android:name="android.intent.category.LAUNCHER" />
               </intent-filter>
           </activity>

       </application>

   </manifest>
   ```

5. **Update MainActivity.java**
   Replace with:
   ```java
   package com.beetagged.app;

   import android.os.Bundle;
   import android.webkit.WebView;
   import androidx.appcompat.app.AppCompatActivity;

   public class MainActivity extends AppCompatActivity {
       private WebView webView;

       @Override
       protected void onCreate(Bundle savedInstanceState) {
           super.onCreate(savedInstanceState);
           
           webView = new WebView(this);
           webView.getSettings().setJavaScriptEnabled(true);
           webView.getSettings().setDomStorageEnabled(true);
           webView.loadUrl("https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev");
           
           setContentView(webView);
       }
   }
   ```

## Method 2: Alternative GitHub Approach

I can create a GitHub repository with the complete project files that you can clone directly into Android Studio.

Would you like me to create a GitHub repository with all the project files, or do you prefer to set up the project manually using the instructions above?

## Build Instructions

Once the project is set up:
1. Build > Generate Signed Bundle/APK
2. Choose APK
3. Create a new keystore or use existing
4. Build release APK
5. Upload to Google Play Console

The APK will contain your BeeTagged web application wrapped as a native Android app with proper contact permissions.
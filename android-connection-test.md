# Android Studio Connection Test Setup

## Step 1: Create Basic Android Project

1. **New Project** in Android Studio
   - Choose "Empty Activity"
   - Name: BeeTagged
   - Package: com.beetagged.app
   - Language: Java
   - API Level: 21+

## Step 2: Add Network Permissions

### In AndroidManifest.xml:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Step 3: Network Security Configuration

### Create res/xml/network_security_config.xml:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">riker.replit.dev</domain>
        <domain includeSubdomains="true">d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev</domain>
    </domain-config>
</network-security-config>
```

### Update AndroidManifest.xml application tag:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="false"
    ... >
```

## Step 4: Add Dependencies

### In app/build.gradle:
```gradle
dependencies {
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
    // existing dependencies...
}
```

## Step 5: Create Connection Test Activity

### MainActivity.java:
```java
package com.beetagged.app;

import android.os.Bundle;
import android.os.AsyncTask;
import android.widget.TextView;
import android.widget.Button;
import androidx.appcompat.app.AppCompatActivity;
import java.io.IOException;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class MainActivity extends AppCompatActivity {
    private TextView statusText;
    private Button testButton;
    private static final String BEETAGGED_URL = 
        "https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        statusText = findViewById(R.id.statusText);
        testButton = findViewById(R.id.testButton);
        
        testButton.setOnClickListener(v -> testConnection());
    }
    
    private void testConnection() {
        new ConnectionTestTask().execute();
    }
    
    private class ConnectionTestTask extends AsyncTask<Void, Void, String> {
        @Override
        protected String doInBackground(Void... voids) {
            OkHttpClient client = new OkHttpClient();
            Request request = new Request.Builder()
                .url(BEETAGGED_URL)
                .build();
                
            try (Response response = client.newCall(request).execute()) {
                return "Status: " + response.code() + 
                       "\nSuccess: " + response.isSuccessful() +
                       "\nMessage: " + response.message();
            } catch (IOException e) {
                return "Error: " + e.getMessage();
            }
        }
        
        @Override
        protected void onPostExecute(String result) {
            statusText.setText(result);
        }
    }
}
```

## Step 6: Update Layout

### res/layout/activity_main.xml:
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="BeeTagged Connection Test"
        android:textSize="18sp"
        android:layout_marginBottom="20dp" />

    <Button
        android:id="@+id/testButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Test BeeTagged Connection" />

    <TextView
        android:id="@+id/statusText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="20dp"
        android:text="Click button to test connection"
        android:textSize="14sp" />

</LinearLayout>
```

This will create a simple Android app that tests the connection to your BeeTagged server and shows you exactly what's happening with the network request.
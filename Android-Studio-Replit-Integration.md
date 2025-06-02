# Android Studio to Replit Integration for BeeTagged

## Option 1: Direct API Integration

### HTTP Client in Android Studio
Add to your `MainActivity.java`:

```java
package com.beetagged.app;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.content.Context;
import java.io.IOException;
import okhttp3.*;

public class MainActivity extends AppCompatActivity {

    private static final String BEETAGGED_API_BASE = "https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/api";
    private OkHttpClient client = new OkHttpClient();
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        setupWebView();
        testReplitConnection();
    }

    private void setupWebView() {
        webView = findViewById(R.id.webview);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        
        // Add JavaScript interface to communicate with Replit
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
        
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev");
    }

    private void testReplitConnection() {
        Request request = new Request.Builder()
            .url(BEETAGGED_API_BASE + "/health")
            .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                e.printStackTrace();
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    String responseData = response.body().string();
                    // Successfully connected to Replit
                    runOnUiThread(() -> {
                        // Update UI to show connection status
                    });
                }
            }
        });
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void callReplitAPI(String endpoint, String data) {
            // Direct API calls to your Replit server
            RequestBody body = RequestBody.create(data, MediaType.get("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                .url(BEETAGGED_API_BASE + endpoint)
                .post(body)
                .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    // Handle failure
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    String result = response.body().string();
                    runOnUiThread(() -> {
                        webView.evaluateJavascript("window.handleReplitResponse('" + result + "')", null);
                    });
                }
            });
        }
    }
}
```

### Add HTTP Client Dependency
In your `app/build.gradle`:

```gradle
dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

## Option 2: Replit Database Integration

### Connect to Replit Database
```java
public class ReplitDatabaseHelper {
    private static final String REPLIT_DB_URL = "your-replit-database-url";
    private OkHttpClient client = new OkHttpClient();

    public void syncContacts(String contactData) {
        RequestBody body = RequestBody.create(contactData, MediaType.get("application/json"));
        Request request = new Request.Builder()
            .url(REPLIT_DB_URL + "/contacts")
            .post(body)
            .addHeader("Authorization", "Bearer your-replit-token")
            .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                // Handle sync response
            }

            @Override
            public void onFailure(Call call, IOException e) {
                // Handle error
            }
        });
    }
}
```

## Option 3: Real-time WebSocket Connection

### WebSocket Integration
```java
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class ReplitWebSocketClient extends WebSocketListener {
    private WebSocket webSocket;
    private static final String WS_URL = "wss://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/ws";

    public void connect() {
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().url(WS_URL).build();
        webSocket = client.newWebSocket(request, this);
    }

    @Override
    public void onMessage(WebSocket webSocket, String text) {
        // Handle real-time updates from Replit
    }

    public void sendContactUpdate(String contactData) {
        webSocket.send(contactData);
    }
}
```

## Configuration Required

### 1. Replit Environment Variables
You'll need to configure:
- API endpoint URLs
- Authentication tokens
- Database connection strings

### 2. Android Permissions
Add to AndroidManifest.xml:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.WRITE_CONTACTS" />
```

Would you like me to help you set up any specific integration between Android Studio and your Replit BeeTagged application? I can configure the API endpoints, authentication, or real-time sync features.
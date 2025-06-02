# Android Studio Native Features for BeeTagged Integration

## 1. HTTP/REST Client (Built-in)

### Create API Test File in Android Studio
File > New > HTTP Request

```http
### Test BeeTagged Connection
GET https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/

### Test Facebook Integration
POST https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/api/auth/facebook/url
Content-Type: application/json

{}

### Upload LinkedIn Data
POST https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/api/linkedin/upload
Content-Type: multipart/form-data; boundary=boundary

--boundary
Content-Disposition: form-data; name="csvFile"; filename="linkedin-connections.csv"
Content-Type: text/csv

--boundary--
```

## 2. Build Variants for Environment Management

### In app/build.gradle
```gradle
android {
    buildTypes {
        debug {
            buildConfigField "String", "BEETAGGED_URL", '"https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev"'
            buildConfigField "String", "API_ENDPOINT", '"/api"'
        }
        release {
            buildConfigField "String", "BEETAGGED_URL", '"https://your-production-replit-url.replit.dev"'
            buildConfigField "String", "API_ENDPOINT", '"/api"'
        }
    }
}
```

## 3. Network Security Configuration

### Create network_security_config.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">replit.dev</domain>
        <domain includeSubdomains="true">riker.replit.dev</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
```

## 4. Firebase Cloud Functions Integration

### Setup Firebase to Proxy Replit
```javascript
// functions/index.js
const functions = require('firebase-functions');
const axios = require('axios');

exports.proxyToReplit = functions.https.onRequest(async (req, res) => {
  const replitUrl = 'https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev';
  
  try {
    const response = await axios({
      method: req.method,
      url: replitUrl + req.path,
      data: req.body,
      headers: req.headers
    });
    
    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(500).send('Proxy error');
  }
});
```

## 5. Android Studio Database Inspector

### Connect to Replit Database
```java
// DatabaseConnection.java
public class ReplitConnection {
    private static final String BASE_URL = BuildConfig.BEETAGGED_URL;
    
    public void syncContactsWithReplit(List<Contact> contacts) {
        // Use Android Studio's built-in HTTP client
        Retrofit retrofit = new Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build();
            
        BeeTaggedAPI api = retrofit.create(BeeTaggedAPI.class);
        Call<ResponseBody> call = api.uploadContacts(contacts);
        
        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                // Handle successful sync
            }
            
            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                // Handle sync failure
            }
        });
    }
}
```

## 6. App Links for Deep Integration

### AndroidManifest.xml Intent Filters
```xml
<activity android:name=".MainActivity">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https"
              android:host="d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev" />
    </intent-filter>
</activity>
```

## 7. Android Studio Profiler Integration

Monitor your Replit connection performance directly in Android Studio:
- Network traffic to Replit
- Response times
- Data transfer volumes
- Error rates

## Next Steps

1. **Test the HTTP client** - Use Android Studio's built-in REST client to test your Replit endpoints
2. **Configure build variants** - Set up different Replit URLs for development/production
3. **Setup Firebase proxy** - If you need additional reliability or caching
4. **Enable deep linking** - Allow direct navigation to your Replit app from Android

Would you like me to help you configure any of these specific Android Studio features for your BeeTagged integration?
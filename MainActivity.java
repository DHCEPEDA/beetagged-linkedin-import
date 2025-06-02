package com.beetagged.app;

import android.os.Bundle;
import android.os.AsyncTask;
import android.widget.TextView;
import android.widget.Button;
import android.widget.ScrollView;
import androidx.appcompat.app.AppCompatActivity;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import java.util.concurrent.TimeUnit;

public class MainActivity extends AppCompatActivity {
    private TextView resultsText;
    private Button testButton;
    private ScrollView scrollView;
    
    // Multiple URL variations to test
    private static final String[] TEST_URLS = {
        "https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/",
        "https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev:5000/",
        "https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev:3000/",
        "http://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/",
        "http://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev:5000/",
        "http://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev:3000/"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        resultsText = findViewById(R.id.resultsText);
        testButton = findViewById(R.id.testButton);
        scrollView = findViewById(R.id.scrollView);
        
        testButton.setOnClickListener(v -> testAllConnections());
        
        resultsText.setText("BeeTagged Connection Test Ready\n\nClick 'Test All Connections' to begin testing multiple URL formats.\n\n");
    }
    
    private void testAllConnections() {
        testButton.setEnabled(false);
        testButton.setText("Testing...");
        resultsText.setText("Starting connection tests...\n\n");
        
        new MultiConnectionTestTask().execute();
    }
    
    private class MultiConnectionTestTask extends AsyncTask<Void, String, String> {
        private StringBuilder allResults = new StringBuilder();
        
        @Override
        protected String doInBackground(Void... voids) {
            OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .build();
            
            List<String> successfulUrls = new ArrayList<>();
            
            for (int i = 0; i < TEST_URLS.length; i++) {
                String url = TEST_URLS[i];
                String result = testSingleUrl(client, url, i + 1);
                allResults.append(result).append("\n");
                
                // Update UI with progress
                publishProgress(allResults.toString());
                
                // Check if this URL was successful
                if (result.contains("SUCCESS") || result.contains("Status: 200")) {
                    successfulUrls.add(url);
                }
                
                // Small delay between requests
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            
            // Summary
            allResults.append("\n=== SUMMARY ===\n");
            if (successfulUrls.isEmpty()) {
                allResults.append("❌ No successful connections found\n");
                allResults.append("This suggests a network or server configuration issue.\n");
            } else {
                allResults.append("✅ Successful connections:\n");
                for (String url : successfulUrls) {
                    allResults.append("• ").append(url).append("\n");
                }
                allResults.append("\nUse these URLs for your Android app integration.\n");
            }
            
            return allResults.toString();
        }
        
        private String testSingleUrl(OkHttpClient client, String url, int testNumber) {
            StringBuilder result = new StringBuilder();
            result.append("Test ").append(testNumber).append(": ").append(url).append("\n");
            
            Request request = new Request.Builder()
                .url(url)
                .addHeader("User-Agent", "BeeTagged-Android-Test/1.0")
                .build();
            
            try (Response response = client.newCall(request).execute()) {
                result.append("✅ SUCCESS\n");
                result.append("Status: ").append(response.code()).append("\n");
                result.append("Message: ").append(response.message()).append("\n");
                result.append("Content-Type: ").append(response.header("Content-Type", "unknown")).append("\n");
                
                if (response.body() != null) {
                    String body = response.body().string();
                    if (body.length() > 100) {
                        result.append("Content: ").append(body.substring(0, 100)).append("...\n");
                    } else {
                        result.append("Content: ").append(body).append("\n");
                    }
                }
                
            } catch (IOException e) {
                result.append("❌ FAILED\n");
                result.append("Error: ").append(e.getMessage()).append("\n");
                
                // Additional error analysis
                if (e.getMessage().contains("502")) {
                    result.append("→ Bad Gateway: Server routing issue\n");
                } else if (e.getMessage().contains("timeout")) {
                    result.append("→ Timeout: Server may be overloaded\n");
                } else if (e.getMessage().contains("SSL")) {
                    result.append("→ SSL Issue: Try HTTP version\n");
                } else if (e.getMessage().contains("refused")) {
                    result.append("→ Connection Refused: Port may be closed\n");
                }
            }
            
            result.append("---\n");
            return result.toString();
        }
        
        @Override
        protected void onProgressUpdate(String... progress) {
            resultsText.setText(progress[0]);
            // Scroll to bottom
            scrollView.post(() -> scrollView.fullScroll(ScrollView.FOCUS_DOWN));
        }
        
        @Override
        protected void onPostExecute(String finalResult) {
            resultsText.setText(finalResult);
            testButton.setEnabled(true);
            testButton.setText("Test All Connections");
            
            // Scroll to bottom to show summary
            scrollView.post(() -> scrollView.fullScroll(ScrollView.FOCUS_DOWN));
        }
    }
}
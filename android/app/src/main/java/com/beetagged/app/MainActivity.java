package com.beetagged.app;

import android.os.Bundle;
import android.view.View;
import android.view.ViewStub;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import androidx.appcompat.app.AppCompatActivity;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity {
    private MemoryOptimizedWebView webView;
    private ViewStub loadingStub;
    private View loadingView;
    private ExecutorService backgroundExecutor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize background executor for heavy operations
        backgroundExecutor = Executors.newSingleThreadExecutor();

        webView = findViewById(R.id.webview);
        loadingStub = findViewById(R.id.loading_stub);
        
        // Inflate loading view
        loadingView = loadingStub.inflate();
        
        // Configure WebView settings for performance and caching
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        
        // Enable caching for better performance
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAppCacheEnabled(true);
        webSettings.setDatabaseEnabled(true);
        
        // Enable compression
        webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        // Performance optimizations
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        
        // Set WebView client to handle page navigation and loading
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                // Show loading view
                if (loadingView != null) {
                    loadingView.setVisibility(View.VISIBLE);
                }
                webView.setVisibility(View.GONE);
                
                // Perform memory monitoring in background
                backgroundExecutor.execute(() -> {
                    monitorMemoryUsage();
                });
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Hide loading view and show WebView
                if (loadingView != null) {
                    loadingView.setVisibility(View.GONE);
                }
                webView.setVisibility(View.VISIBLE);
            }
        });

        // Set WebChromeClient for better performance monitoring
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                // Monitor progress and optimize accordingly
                if (newProgress == 100) {
                    // Page fully loaded, perform cleanup
                    backgroundExecutor.execute(() -> {
                        System.gc(); // Suggest garbage collection
                    });
                }
            }
        });

        // Load your BeeTagged application
        webView.loadUrl("https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/");
    }
    
    /**
     * Monitor memory usage and perform cleanup if needed
     */
    private void monitorMemoryUsage() {
        Runtime runtime = Runtime.getRuntime();
        long usedMemory = runtime.totalMemory() - runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        
        // If using more than 75% of available memory, trigger cleanup
        if (usedMemory > maxMemory * 0.75) {
            runOnUiThread(() -> {
                if (webView != null) {
                    webView.clearCache(false); // Clear cache but keep login data
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        // Shutdown background executor to prevent memory leaks
        if (backgroundExecutor != null && !backgroundExecutor.isShutdown()) {
            backgroundExecutor.shutdown();
        }
        
        // Clean up WebView properly
        if (webView != null) {
            webView.cleanup(); // Use our custom cleanup method
        }
        
        super.onDestroy();
    }
    
    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
            webView.pauseTimers();
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }
    
    @Override
    public void onLowMemory() {
        super.onLowMemory();
        // Handle low memory situation
        if (webView != null) {
            webView.freeMemory();
            webView.clearCache(true);
        }
        System.gc(); // Suggest garbage collection
    }
}
package com.beetagged.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.AsyncTask;
import android.util.AttributeSet;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.lang.ref.WeakReference;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Memory-optimized WebView that prevents memory leaks and improves performance
 */
public class MemoryOptimizedWebView extends WebView {
    
    private ExecutorService backgroundExecutor;
    private WeakReference<Context> contextRef;
    
    public MemoryOptimizedWebView(Context context) {
        super(context);
        init(context);
    }
    
    public MemoryOptimizedWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }
    
    public MemoryOptimizedWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context);
    }
    
    private void init(Context context) {
        this.contextRef = new WeakReference<>(context);
        this.backgroundExecutor = Executors.newSingleThreadExecutor();
        
        setWebViewClient(new MemoryOptimizedWebViewClient());
    }
    
    /**
     * Custom WebViewClient that handles memory management
     */
    private class MemoryOptimizedWebViewClient extends WebViewClient {
        
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            
            // Execute heavy operations in background thread
            backgroundExecutor.execute(() -> {
                // Clear cache if needed to free memory
                Context context = contextRef.get();
                if (context != null) {
                    // Perform background cleanup tasks
                    System.gc(); // Suggest garbage collection
                }
            });
        }
        
        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            
            // Background task to optimize memory after page load
            new MemoryOptimizationTask(MemoryOptimizedWebView.this).execute();
        }
        
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            view.loadUrl(url);
            return true;
        }
    }
    
    /**
     * AsyncTask for memory optimization operations
     */
    private static class MemoryOptimizationTask extends AsyncTask<Void, Void, Void> {
        private WeakReference<MemoryOptimizedWebView> webViewRef;
        
        MemoryOptimizationTask(MemoryOptimizedWebView webView) {
            webViewRef = new WeakReference<>(webView);
        }
        
        @Override
        protected Void doInBackground(Void... voids) {
            // Perform memory optimization in background
            MemoryOptimizedWebView webView = webViewRef.get();
            if (webView != null) {
                // Clear unnecessary cache
                webView.post(() -> {
                    // Clear form data and history if memory is low
                    Runtime runtime = Runtime.getRuntime();
                    long usedMemory = runtime.totalMemory() - runtime.freeMemory();
                    long maxMemory = runtime.maxMemory();
                    
                    // If using more than 80% of available memory, clear caches
                    if (usedMemory > maxMemory * 0.8) {
                        webView.clearCache(true);
                        webView.clearFormData();
                    }
                });
            }
            return null;
        }
    }
    
    /**
     * Clean up resources to prevent memory leaks
     */
    public void cleanup() {
        if (backgroundExecutor != null && !backgroundExecutor.isShutdown()) {
            backgroundExecutor.shutdown();
        }
        
        // Clear WebView resources
        clearCache(true);
        clearHistory();
        clearFormData();
        
        // Remove all views and destroy
        removeAllViews();
        destroyDrawingCache();
        
        // Final cleanup
        destroy();
    }
    
    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        cleanup();
    }
}
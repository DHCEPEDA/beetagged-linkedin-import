package com.beetagged.app;

import android.os.Bundle;
import android.view.View;
import android.view.ViewStub;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ViewStub loadingStub;
    private View loadingView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

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
                // You can add progress bar updates here if needed
            }
        });

        // Load your BeeTagged application
        webView.loadUrl("https://d49cd8c1-1139-4a7e-96a2-5d125f417ecd-00-3ftoc46fv9y6p.riker.replit.dev/");
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
        if (webView != null) {
            webView.removeAllViews();
            webView.destroy();
        }
        super.onDestroy();
    }
}
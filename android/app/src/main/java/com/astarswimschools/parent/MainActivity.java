package com.astarswimschools.parent;

import android.os.Bundle;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import android.util.Base64;
import android.net.Uri;

public class MainActivity extends BridgeActivity {
    private long lastBackPressTime = 0;
    private static final long DOUBLE_PRESS_INTERVAL = 2000; // 2 seconds
    private Toast exitToast;

    private boolean isRootUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return true;
        }
        try {
            Uri uri = Uri.parse(url);
            String path = uri.getPath();
            if (path == null || path.isEmpty() || path.equals("/")) {
                return true;
            }
            if (path.equals("/sign-in") || path.equals("/sign-up") || path.equals("/get-app")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            return url.endsWith("/") || url.endsWith("/sign-in") || url.endsWith("/sign-up") || url.endsWith("/get-app") || !url.contains("/");
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView.setWebContentsDebuggingEnabled(true);

        // Native Double-Tap Back Button to Close App
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge().getWebView();
                long currentTime = System.currentTimeMillis();

                // If user taps back again within 2 seconds -> close the app immediately!
                if (currentTime - lastBackPressTime < DOUBLE_PRESS_INTERVAL) {
                    if (exitToast != null) {
                        exitToast.cancel();
                    }
                    finish();
                    return;
                }

                String currentUrl = (webView != null) ? webView.getUrl() : null;
                boolean atRoot = (webView == null) || !webView.canGoBack() || isRootUrl(currentUrl);

                if (atRoot) {
                    lastBackPressTime = currentTime;
                    if (exitToast != null) {
                        exitToast.cancel();
                    }
                    exitToast = Toast.makeText(MainActivity.this, "Press back again to exit", Toast.LENGTH_SHORT);
                    exitToast.show();
                } else {
                    webView.goBack();
                }
            }
        });

        this.getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                injectMobileTheme(webView);
            }
        });
    }

    private void injectMobileTheme(WebView webView) {
        try {
            InputStream is = getAssets().open("mobile-theme.css");
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            int nRead;
            byte[] data = new byte[2048];
            while ((nRead = is.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }
            buffer.flush();
            byte[] cssBytes = buffer.toByteArray();
            is.close();

            String encodedCss = Base64.encodeToString(cssBytes, Base64.NO_WRAP);
            String js = "(function() {" +
                        "  var existing = document.getElementById('mobile-theme-injected');" +
                        "  if (!existing) {" +
                        "    var style = document.createElement('style');" +
                        "    style.id = 'mobile-theme-injected';" +
                        "    style.type = 'text/css';" +
                        "    style.innerHTML = window.atob('" + encodedCss + "');" +
                        "    document.head.appendChild(style);" +
                        "  }" +
                        "})();";
            webView.evaluateJavascript(js, null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

package com.byazenb.bladeandcoins;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileInputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;

/**
 * «Клинок и Монеты: Кузница Хаоса»
 * Минималистичная оболочка: только framework WebView, без внешних библиотек.
 * Игра лежит в assets/www, сохранения пишутся во внутреннюю память через JS-мост.
 */
public class MainActivity extends Activity {

    private static final String TAG = "BladeAndCoins";
    private static final String GAME_URL = "file:///android_asset/www/index.html";
    private static final String SAVE_FILE = "save.json";
    private static final String CRASH_FILE = "crash.log";

    private WebView webView;
    private final Handler ui = new Handler(Looper.getMainLooper());

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Thread.setDefaultUncaughtExceptionHandler(new CrashHandler(this, Thread.getDefaultUncaughtExceptionHandler()));

        try {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
        } catch (Throwable t) {
            Log.w(TAG, "window flags", t);
        }

        webView = new WebView(getApplicationContext());
        webView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(webView);

        try {
            WebSettings ws = webView.getSettings();
            ws.setJavaScriptEnabled(true);
            ws.setDomStorageEnabled(true);
            ws.setDatabaseEnabled(true);
            ws.setAllowFileAccess(true);
            ws.setAllowContentAccess(true);
            ws.setAllowFileAccessFromFileURLs(true);
            ws.setAllowUniversalAccessFromFileURLs(true);
            ws.setLoadWithOverviewMode(false);
            ws.setUseWideViewPort(false);
            ws.setSupportZoom(false);
            ws.setBuiltInZoomControls(false);
            ws.setDisplayZoomControls(false);
            ws.setMediaPlaybackRequiresUserGesture(false);
            ws.setCacheMode(WebSettings.LOAD_DEFAULT);
            ws.setTextZoom(100);
            try {
                ws.setOffscreenPreRaster(true);
            } catch (Throwable ignored) { }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ws.setSafeBrowsingEnabled(false);
            }
        } catch (Throwable t) {
            Log.e(TAG, "web settings", t);
        }

        webView.setBackgroundColor(0xFF0D0518);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setVerticalScrollBarEnabled(false);
        webView.addJavascriptInterface(new GameBridge(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String s = uri.toString();
                if (s.startsWith("file:///android_asset/")) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException e) {
                    Log.w(TAG, "cannot open " + s);
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                Log.d(TAG, "page finished: " + url);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d(TAG, "JS: " + cm.message());
                return true;
            }
        });

        webView.loadUrl(GAME_URL);

        File crash = new File(getFilesDir(), CRASH_FILE);
        if (crash.exists() && crash.length() > 0) {
            String text = readFile(crash);
            crash.delete();
            showCrashDialog(text);
        }
    }

    private void showCrashDialog(String text) {
        try {
            ScrollView sv = new ScrollView(this);
            LinearLayout ll = new LinearLayout(this);
            ll.setOrientation(LinearLayout.VERTICAL);
            ll.setPadding(32, 32, 32, 32);
            TextView tv = new TextView(this);
            tv.setText("Прошлый запуск упал:\n\n" + text);
            tv.setTextIsSelectable(true);
            tv.setTextSize(11f);
            ll.addView(tv);
            sv.addView(ll);
            new AlertDialog.Builder(this)
                    .setTitle("Отчёт об ошибке")
                    .setView(sv)
                    .setPositiveButton("OK", null)
                    .show();
        } catch (Throwable t) {
            Log.w(TAG, "crash dialog", t);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            try {
                webView.evaluateJavascript("try{ if(window.ST) ST.save(); }catch(e){}", null);
            } catch (Throwable ignored) { }
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            try {
                webView.stopLoading();
                webView.destroy();
            } catch (Throwable ignored) { }
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        try {
            webView.evaluateJavascript(
                    "(function(){ try { return (window.onBackPressed && window.onBackPressed()) ? 'true' : 'false'; } catch(e) { return 'false'; } })()",
                    new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (value == null || !value.contains("true")) {
                                ui.post(new Runnable() {
                                    @Override
                                    public void run() {
                                        moveTaskToBack(true);
                                    }
                                });
                            }
                        }
                    });
        } catch (Throwable t) {
            moveTaskToBack(true);
        }
    }

    /* ======================= JS bridge ======================= */
    private class GameBridge {

        @JavascriptInterface
        public void saveGame(String data) {
            try {
                File dir = getFilesDir();
                File tmp = new File(dir, SAVE_FILE + ".tmp");
                File dst = new File(dir, SAVE_FILE);
                FileOutputStream out = new FileOutputStream(tmp);
                out.write(data.getBytes(StandardCharsets.UTF_8));
                out.close();
                if (!tmp.renameTo(dst)) {
                    // если rename не сработал — пишем напрямую
                    FileOutputStream o2 = new FileOutputStream(dst);
                    o2.write(data.getBytes(StandardCharsets.UTF_8));
                    o2.close();
                    tmp.delete();
                }
            } catch (Throwable t) {
                Log.e(TAG, "saveGame", t);
            }
        }

        @JavascriptInterface
        public String loadSave() {
            try {
                File f = new File(getFilesDir(), SAVE_FILE);
                if (!f.exists()) return "";
                int len = (int) f.length();
                byte[] buf = new byte[len];
                FileInputStream in = new FileInputStream(f);
                int read = 0;
                while (read < len) {
                    int r = in.read(buf, read, len - read);
                    if (r <= 0) break;
                    read += r;
                }
                in.close();
                return new String(buf, 0, read, StandardCharsets.UTF_8);
            } catch (Throwable t) {
                Log.e(TAG, "loadSave", t);
                return "";
            }
        }

        @JavascriptInterface
        public void toast(final String msg) {
            ui.post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void vibrate(int ms) {
            try {
                android.os.Vibrator v = (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v == null) return;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(android.os.VibrationEffect.createOneShot(Math.max(10, ms), 120));
                } else {
                    v.vibrate(Math.max(10, ms));
                }
            } catch (Throwable ignored) { }
        }

        @JavascriptInterface
        public int getVersionCode() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            } catch (Throwable t) {
                return 0;
            }
        }
    }

    /* ======================= utils ======================= */
    private static String readFile(File f) {
        try {
            int len = (int) f.length();
            if (len > 20000) len = 20000;
            byte[] buf = new byte[len];
            FileInputStream in = new FileInputStream(f);
            int read = 0;
            while (read < len) {
                int r = in.read(buf, read, len - read);
                if (r <= 0) break;
                read += r;
            }
            in.close();
            return new String(buf, 0, read, StandardCharsets.UTF_8);
        } catch (Throwable t) {
            return "не удалось прочитать лог: " + t;
        }
    }

    private static class CrashHandler implements Thread.UncaughtExceptionHandler {
        private final Context ctx;
        private final Thread.UncaughtExceptionHandler prev;

        CrashHandler(Context ctx, Thread.UncaughtExceptionHandler prev) {
            this.ctx = ctx.getApplicationContext();
            this.prev = prev;
        }

        @Override
        public void uncaughtException(Thread t, Throwable e) {
            try {
                StringWriter sw = new StringWriter();
                PrintWriter pw = new PrintWriter(sw);
                pw.append("Device: ").append(Build.MANUFACTURER).append(' ').append(Build.MODEL)
                        .append(" | API ").append(String.valueOf(Build.VERSION.SDK_INT)).append('\n');
                e.printStackTrace(pw);
                pw.flush();
                FileOutputStream out = ctx.openFileOutput(CRASH_FILE, Context.MODE_PRIVATE);
                out.write(sw.toString().getBytes(StandardCharsets.UTF_8));
                out.close();
            } catch (Throwable ignored) { }
            if (prev != null) prev.uncaughtException(t, e);
        }
    }
}

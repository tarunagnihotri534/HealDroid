import os
import subprocess
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path("d:/HEALDROID")
BUILD_DIR = BASE_DIR / "tools" / "apk-build-workspace"
TOOLS_DIR = BASE_DIR / "tools" / "apk-builder"
JDK_BIN = Path("C:/Program Files/Java/jdk-25/bin")

AAPT2_EXE = TOOLS_DIR / "aapt2.exe"
ANDROID_JAR = TOOLS_DIR / "android.jar"
R8_JAR = TOOLS_DIR / "r8.jar"
KEYTOOL_EXE = JDK_BIN / "keytool.exe"
JARSIGNER_EXE = JDK_BIN / "jarsigner.exe"
JAVAC_EXE = JDK_BIN / "javac.exe"

def create_h_logo(size: int) -> Image.Image:
    """Generates the premium emerald teal HealDroid 'H' logo icon."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background Rounded Squircle with Emerald/Teal Gradient
    corner_radius = int(size * 0.22)
    # Create gradient background
    base_color = (13, 148, 136, 255) # #0D9488 Teal-600
    dark_teal = (15, 118, 110, 255)  # #0F766E Teal-700
    
    # Draw rounded rectangle
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=corner_radius, fill=base_color)
    
    # Subtle inner border/ring
    border_color = (45, 212, 191, 180) # #2DD4BF Teal-400
    draw.rounded_rectangle([(2, 2), (size - 3, size - 3)], radius=corner_radius, outline=border_color, width=max(1, int(size * 0.03)))

    # 2. Draw the elegant italic "H"
    # Fallback to drawing polygon/lines for the styled "H" if font is generic
    # Let's draw the stylized "H" precisely using polygons:
    # Left vertical stem (tilted/italic), Crossbar, Right vertical stem (tilted/italic)
    cx = size / 2.0
    cy = size / 2.0
    h_h = size * 0.52   # Height of H
    h_w = size * 0.44   # Width of H
    stem_w = size * 0.11 # Stem width
    slant = size * 0.06 # Italic slant

    # Left stem coordinates: (top-left, top-right, bottom-right, bottom-left)
    l_top_x = cx - (h_w / 2) + slant
    l_top_y = cy - (h_h / 2)
    l_bot_x = cx - (h_w / 2) - slant
    l_bot_y = cy + (h_h / 2)

    left_stem = [
        (l_top_x, l_top_y),
        (l_top_x + stem_w, l_top_y),
        (l_bot_x + stem_w, l_bot_y),
        (l_bot_x, l_bot_y)
    ]

    # Right stem coordinates
    r_top_x = cx + (h_w / 2) - stem_w + slant
    r_top_y = cy - (h_h / 2)
    r_bot_x = cx + (h_w / 2) - stem_w - slant
    r_bot_y = cy + (h_h / 2)

    right_stem = [
        (r_top_x, r_top_y),
        (r_top_x + stem_w, r_top_y),
        (r_bot_x + stem_w, r_bot_y),
        (r_bot_x, r_bot_y)
    ]

    # Crossbar coordinates
    bar_y1 = cy - (stem_w * 0.45)
    bar_y2 = cy + (stem_w * 0.45)
    cross_bar = [
        (l_top_x + (stem_w * 0.5), bar_y1),
        (r_top_x + (stem_w * 0.5), bar_y1),
        (r_bot_x + (stem_w * 0.5), bar_y2),
        (l_bot_x + (stem_w * 0.5), bar_y2)
    ]

    # Draw white elements
    white = (255, 255, 255, 255)
    draw.polygon(left_stem, fill=white)
    draw.polygon(right_stem, fill=white)
    draw.polygon(cross_bar, fill=white)

    return img

def main():
    print("=== Building HealDroid Android APK ===")
    
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    res_dir = BUILD_DIR / "res"
    src_dir = BUILD_DIR / "src"
    bin_dir = BUILD_DIR / "bin"
    compiled_res = BUILD_DIR / "compiled_res.zip"
    unaligned_apk = BUILD_DIR / "unaligned.apk"
    final_apk = BASE_DIR / "public" / "HealDroid-v1.0.apk"
    root_apk = BASE_DIR / "HealDroid-v1.0.apk"

    # 1. Generate App Icons (Mipmap sizes)
    icon_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
        "drawable": 192
    }

    for folder, sz in icon_sizes.items():
        d = res_dir / folder
        d.mkdir(parents=True, exist_ok=True)
        img = create_h_logo(sz)
        img.save(d / "ic_launcher.png", "PNG")
        img.save(d / "ic_launcher_round.png", "PNG")
    print("[OK] App Icons generated with 'H' logo in all mipmap densities")

    # 2. Generate values (strings, styles)
    val_dir = res_dir / "values"
    val_dir.mkdir(parents=True, exist_ok=True)
    
    (val_dir / "strings.xml").write_text("""<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">HealDroid</string>
</resources>""", encoding="utf-8")

    (val_dir / "styles.xml").write_text("""<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">#0F172A</item>
        <item name="android:navigationBarColor">#0F172A</item>
        <item name="android:windowBackground">#0F172A</item>
    </style>
</resources>""", encoding="utf-8")

    # 3. Generate AndroidManifest.xml
    manifest_file = BUILD_DIR / "AndroidManifest.xml"
    manifest_file.write_text("""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.healdroid.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true"
        android:allowBackup="true">

        <activity
            android:name="com.healdroid.app.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>
</manifest>""", encoding="utf-8")
    print("[OK] AndroidManifest.xml created")

    # 4. Compile Resources with AAPT2
    print("Compiling resources with aapt2...")
    subprocess.run([
        str(AAPT2_EXE), "compile",
        "--dir", str(res_dir),
        "-o", str(compiled_res)
    ], check=True)

    # 5. Link Resources & Generate R.java + unaligned base APK
    print("Linking resources with aapt2...")
    java_gen_dir = src_dir
    java_gen_dir.mkdir(parents=True, exist_ok=True)

    subprocess.run([
        str(AAPT2_EXE), "link",
        "-o", str(unaligned_apk),
        "-I", str(ANDROID_JAR),
        "--manifest", str(manifest_file),
        str(compiled_res),
        "--auto-add-overlay",
        "--java", str(java_gen_dir)
    ], check=True)
    print("[OK] AAPT2 link succeeded. R.java generated.")

    # 6. Create MainActivity.java
    pkg_dir = src_dir / "com" / "healdroid" / "app"
    pkg_dir.mkdir(parents=True, exist_ok=True)
    
    (pkg_dir / "MainActivity.java").write_text("""package com.healdroid.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.ValueCallback;
import android.content.Intent;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> uploadMessage;
    private final static int FILE_CHOOSER_RESULT_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        RelativeLayout layout = new RelativeLayout(this);
        layout.setBackgroundColor(Color.parseColor("#0F172A"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#0F172A"));
        
        final ProgressBar progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.VISIBLE);
        
        RelativeLayout.LayoutParams pbParams = new RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT, 8
        );
        pbParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        progressBar.setLayoutParams(pbParams);

        RelativeLayout.LayoutParams webParams = new RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.MATCH_PARENT
        );
        webView.setLayoutParams(webParams);

        layout.addView(webView);
        layout.addView(progressBar);
        setContentView(layout);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUserAgentString(settings.getUserAgentString() + " HealDroidApp/1.0");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress == 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                }
                uploadMessage = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    uploadMessage = null;
                    return false;
                }
                return true;
            }
        });

        // Load HealDroid Production Web App
        webView.loadUrl("https://heal-droid.onrender.com");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (uploadMessage == null) return;
            uploadMessage.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            uploadMessage = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
""", encoding="utf-8")
    print("[OK] MainActivity.java created")

    # 7. Compile Java to .class files
    bin_dir.mkdir(parents=True, exist_ok=True)
    java_files = list(src_dir.rglob("*.java"))
    java_file_paths = [str(f) for f in java_files]

    print("Compiling Java classes with javac...")
    subprocess.run([
        str(JAVAC_EXE),
        "--release", "8",
        "-cp", str(ANDROID_JAR),
        "-d", str(bin_dir),
        *java_file_paths
    ], check=True)
    print("[OK] Java classes compiled successfully")

    # 8. Convert .class to classes.dex with D8/R8
    print("D8 compiling classes to DEX...")
    class_files = list(bin_dir.rglob("*.class"))
    class_file_paths = [str(f) for f in class_files]

    subprocess.run([
        "java", "-cp", str(R8_JAR),
        "com.android.tools.r8.D8",
        "--lib", str(ANDROID_JAR),
        "--min-api", "24",
        "--output", str(BUILD_DIR),
        *class_file_paths
    ], check=True)
    
    dex_file = BUILD_DIR / "classes.dex"
    if not dex_file.exists():
        raise RuntimeError("classes.dex was not generated!")
    print(f"[OK] classes.dex generated ({dex_file.stat().st_size} bytes)")

    # 9. Add classes.dex into unaligned.apk
    with zipfile.ZipFile(unaligned_apk, 'a') as apk_zip:
        apk_zip.write(dex_file, "classes.dex")
    print("[OK] classes.dex packed into APK")

    # 10. Generate Keystore and Sign APK
    keystore_file = BUILD_DIR / "healdroid.keystore"
    if not keystore_file.exists():
        print("Generating release keystore...")
        subprocess.run([
            str(KEYTOOL_EXE),
            "-genkeypair",
            "-alias", "healdroid",
            "-keypass", "healdroid2026",
            "-keystore", str(keystore_file),
            "-storepass", "healdroid2026",
            "-dname", "CN=HealDroid, OU=Security, O=HealDroid SAST, C=US",
            "-validity", "10000",
            "-keyalg", "RSA",
            "-keysize", "2048"
        ], check=True)

    print("Signing APK with jarsigner...")
    subprocess.run([
        str(JARSIGNER_EXE),
        "-keystore", str(keystore_file),
        "-storepass", "healdroid2026",
        "-keypass", "healdroid2026",
        "-sigalg", "SHA256withRSA",
        "-digestalg", "SHA-256",
        str(unaligned_apk),
        "healdroid"
    ], check=True)

    # 11. Copy final signed installable APK to destinations
    shutil.copy2(unaligned_apk, final_apk)
    shutil.copy2(unaligned_apk, root_apk)

    print(f"\n==========================================")
    print(f"[SUCCESS] Valid Installable APK Generated:")
    print(f"File: {final_apk} ({final_apk.stat().st_size:,} bytes)")
    print(f"File: {root_apk} ({root_apk.stat().st_size:,} bytes)")
    print(f"==========================================")

if __name__ == "__main__":
    main()

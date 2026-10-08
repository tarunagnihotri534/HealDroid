import os
import subprocess
import shutil
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw

BASE_DIR = Path("d:/HEALDROID")
BUILD_DIR = BASE_DIR / "tools" / "apk-build-workspace"
TOOLS_DIR = BASE_DIR / "tools" / "apk-builder"

def get_jdk_bin() -> Path:
    java_home = os.environ.get("JAVA_HOME")
    if java_home:
        p = Path(java_home) / "bin"
        if (p / "javac.exe").exists():
            return p
    for candidate in [
        Path("C:/Program Files/Eclipse Adoptium/jdk-17.0.20.101-hotspot/bin"),
        Path("C:/Program Files/Java/jdk-17/bin"),
        Path("C:/Program Files/Java/jdk-21/bin"),
        Path("C:/Program Files/Java/jdk-25/bin"),
    ]:
        if (candidate / "javac.exe").exists():
            return candidate
    which_javac = shutil.which("javac")
    if which_javac:
        return Path(which_javac).parent
    raise RuntimeError("JDK not found! Please set JAVA_HOME or ensure javac is on PATH.")

JDK_BIN = get_jdk_bin()
AAPT2_EXE = TOOLS_DIR / "aapt2.exe"
ANDROID_JAR = TOOLS_DIR / "android.jar"
R8_JAR = TOOLS_DIR / "r8.jar"
UBER_SIGNER_JAR = TOOLS_DIR / "uber-apk-signer.jar"
PERMANENT_KEYSTORE = TOOLS_DIR / "healdroid-release.keystore"

KEYTOOL_EXE = JDK_BIN / "keytool.exe"
JAVAC_EXE = JDK_BIN / "javac.exe"
JAVA_EXE = JDK_BIN / "java.exe"

def ensure_uber_signer():
    if not UBER_SIGNER_JAR.exists():
        print(f"Downloading uber-apk-signer to {UBER_SIGNER_JAR}...")
        url = "https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar"
        import urllib.request
        TOOLS_DIR.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, UBER_SIGNER_JAR)
        print("[OK] uber-apk-signer downloaded successfully")

def create_h_logo(size: int) -> Image.Image:
    """Generates the premium emerald teal HealDroid 'H' logo icon."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background Rounded Squircle with Emerald/Teal Gradient
    corner_radius = int(size * 0.22)
    base_color = (13, 148, 136, 255) # #0D9488 Teal-600
    
    # Draw rounded rectangle
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=corner_radius, fill=base_color)
    
    # Subtle inner border/ring
    border_color = (45, 212, 191, 180) # #2DD4BF Teal-400
    draw.rounded_rectangle([(2, 2), (size - 3, size - 3)], radius=corner_radius, outline=border_color, width=max(1, int(size * 0.03)))

    # 2. Draw the elegant italic "H"
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
    print(f"Using JDK: {JDK_BIN}")
    ensure_uber_signer()
    
    if BUILD_DIR.exists():
        shutil.rmtree(BUILD_DIR)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    res_dir = BUILD_DIR / "res"
    src_dir = BUILD_DIR / "src"
    bin_dir = BUILD_DIR / "bin"
    signed_dir = BUILD_DIR / "signed_out"
    signed_dir.mkdir(parents=True, exist_ok=True)
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
    # Targeting API 34 with min API 21 for maximum device compatibility (Android 5.0 through 15)
    manifest_file = BUILD_DIR / "AndroidManifest.xml"
    manifest_file.write_text("""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.healdroid.app"
    android:versionCode="2"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true"
        android:allowBackup="true"
        android:supportsRtl="true">

        <activity
            android:name="com.healdroid.app.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout|smallestScreenSize"
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

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

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
                    uploadMessage = null;
                }
                uploadMessage = filePathCallback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    try {
                        Intent fallbackIntent = new Intent(Intent.ACTION_GET_CONTENT);
                        fallbackIntent.addCategory(Intent.CATEGORY_OPENABLE);
                        fallbackIntent.setType("*/*");
                        startActivityForResult(Intent.createChooser(fallbackIntent, "Select File"), FILE_CHOOSER_RESULT_CODE);
                    } catch (Exception ex) {
                        uploadMessage = null;
                        return false;
                    }
                }
                return true;
            }
        });

        // Load HealDroid Production Platform
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
    print("D8 compiling classes to DEX (min-api 21)...")
    class_files = list(bin_dir.rglob("*.class"))
    class_file_paths = [str(f) for f in class_files]

    subprocess.run([
        str(JAVA_EXE), "-cp", str(R8_JAR),
        "com.android.tools.r8.D8",
        "--lib", str(ANDROID_JAR),
        "--min-api", "21",
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
    print("[OK] classes.dex packed into base APK")

    # 10. Permanent Release Keystore Management
    if not PERMANENT_KEYSTORE.exists():
        print(f"Generating permanent release keystore at {PERMANENT_KEYSTORE}...")
        subprocess.run([
            str(KEYTOOL_EXE),
            "-genkeypair",
            "-alias", "healdroid",
            "-keypass", "healdroid2026",
            "-keystore", str(PERMANENT_KEYSTORE),
            "-storepass", "healdroid2026",
            "-dname", "CN=HealDroid, OU=Security, O=HealDroid SAST, C=US",
            "-validity", "10000",
            "-keyalg", "RSA",
            "-keysize", "2048"
        ], check=True)
    else:
        print(f"[OK] Using existing permanent keystore: {PERMANENT_KEYSTORE}")

    # 11. Sign & Zipalign with uber-apk-signer (v1, v2, v3 schemes + 4-byte zipalign)
    print("Aligning and signing APK with uber-apk-signer (v1, v2, v3)...")
    subprocess.run([
        str(JAVA_EXE), "-jar", str(UBER_SIGNER_JAR),
        "-a", str(unaligned_apk),
        "--ks", str(PERMANENT_KEYSTORE),
        "--ksAlias", "healdroid",
        "--ksPass", "healdroid2026",
        "--ksKeyPass", "healdroid2026",
        "--allowResign",
        "-o", str(signed_dir)
    ], check=True)

    signed_apks = list(signed_dir.glob("*.apk"))
    if not signed_apks:
        raise RuntimeError(f"No signed APK found in {signed_dir}")
    produced_apk = signed_apks[0]
    print(f"[OK] Produced signed and aligned APK: {produced_apk}")

    # 12. Automated Verification Check
    print("Verifying signature schemes and zipalign...")
    verify_proc = subprocess.run([
        str(JAVA_EXE), "-jar", str(UBER_SIGNER_JAR),
        "-y",
        "-a", str(produced_apk),
        "--verbose"
    ], capture_output=True, text=True)
    
    print(verify_proc.stdout)
    if verify_proc.returncode != 0:
        print(verify_proc.stderr)
        raise RuntimeError("APK verification failed!")
    
    # 13. Deploy to distribution targets
    shutil.copy2(produced_apk, final_apk)
    shutil.copy2(produced_apk, root_apk)

    print("==================================================")
    print("[SUCCESS] Fully Valid, Installable APK Generated:")
    print(f"  Target 1: {final_apk} ({final_apk.stat().st_size:,} bytes)")
    print(f"  Target 2: {root_apk} ({root_apk.stat().st_size:,} bytes)")
    print("  Signature Schemes: v1, v2, v3 Verified")
    print("  Alignment: 4-byte zipalign Verified")
    print("  Compatibility: Android 5.0 (API 21) - Android 15 (API 35)")
    print("==================================================")

if __name__ == "__main__":
    main()

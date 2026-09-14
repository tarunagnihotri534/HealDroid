import zipfile
from pathlib import Path

manifest_content = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.test.vulnerableapp"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="27" />

    <!-- Dangerous Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />

    <application
        android:allowBackup="true"
        android:debuggable="true"
        android:usesCleartextTraffic="true"
        android:label="Sample Vulnerable App">

        <!-- Exported Activity -->
        <activity
            android:name="com.test.vulnerableapp.DeepLinkActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="testapp" android:host="auth" />
            </intent-filter>
        </activity>

        <!-- Exported Receiver -->
        <receiver
            android:name="com.test.vulnerableapp.PushReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="com.test.vulnerableapp.ACTION_PUSH" />
            </intent-filter>
        </receiver>

        <!-- Exported Service -->
        <service
            android:name="com.test.vulnerableapp.SyncService"
            android:exported="true" />

        <!-- Exported Content Provider -->
        <provider
            android:name="com.test.vulnerableapp.UserProvider"
            android:authorities="com.test.vulnerableapp.provider"
            android:exported="true" />

    </application>
</manifest>"""

auth_java = """package com.test.vulnerableapp;

public class AuthManager {
    // ⚠ Hardcoded AWS Access Key
    public static final String AWS_ACCESS_KEY = "AKIA1111222233334444";

    // ⚠ Hardcoded API Key & Password Literals
    private String apiKey = "fake_test_api_key_literal_9988776655";
    private String adminPassword = "SuperSecretAdminP@ssword2026!";

    // ⚠ Hardcoded JWT Token
    private String jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJhZG1pbiI6dHJ1ZX0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ";
}"""

crypto_java = """package com.test.vulnerableapp;

import javax.crypto.Cipher;
import java.security.MessageDigest;
import java.util.Random;

public class CryptoService {
    public void runCrypto(String input) throws Exception {
        // ⚠ Insecure Cipher: DES
        Cipher cipherDes = Cipher.getInstance("DES/ECB/PKCS5Padding");

        // ⚠ Insecure Mode: AES in ECB mode
        Cipher cipherEcb = Cipher.getInstance("AES/ECB/NoPadding");

        // ⚠ Weak Hash: MD5
        MessageDigest md5 = MessageDigest.getInstance("MD5");
        byte[] md5Hash = md5.digest(input.getBytes());

        // ⚠ Weak Hash: SHA-1
        MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
        byte[] sha1Hash = sha1.digest(input.getBytes());

        // ⚠ Insecure RNG for security tokens
        Random rng = new Random();
        int sessionToken = rng.nextInt(999999);
    }
}"""

network_java = """package com.test.vulnerableapp;

import java.net.HttpURLConnection;
import java.net.URL;
import javax.net.ssl.*;
import java.security.cert.X509Certificate;

public class NetworkClient {
    public void disableCertValidation() throws Exception {
        // ⚠ Disabled TLS/SSL Certificate Validation (TrustAllCerts)
        TrustManager[] trustAllCerts = new TrustManager[] {
            new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return null; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }
        };

        SSLContext sc = SSLContext.getInstance("SSL");
        sc.init(null, trustAllCerts, new java.security.SecureRandom());
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
        HttpsURLConnection.setDefaultHostnameVerifier(new HostnameVerifier() {
            public boolean verify(String hostname, SSLSession session) { return true; }
        });

        // ⚠ Cleartext HTTP endpoint
        URL url = new URL("http://insecure-api.vulnerableapp.com/api/v1/data");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    }
}"""

db_java = """package com.test.vulnerableapp;

import android.database.sqlite.SQLiteDatabase;

public class DatabaseHelper {
    // ⚠ Unencrypted SQLite Database
    public void executeUserQuery(SQLiteDatabase db, String userInput) {
        // ⚠ SQL Injection via dynamic query concatenation
        String query = "SELECT * FROM accounts WHERE username = '" + userInput + "'";
        db.rawQuery(query, null);
    }
}"""

web_java = """package com.test.vulnerableapp;

import android.webkit.WebView;
import android.webkit.WebSettings;

public class WebActivity {
    public void setupWeb(WebView webView) {
        WebSettings settings = webView.getSettings();
        // ⚠ Insecure WebView with JavaScript Bridge & Universal File Access
        settings.setJavaScriptEnabled(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        webView.addJavascriptInterface(new Object(), "AndroidNativeBridge");
    }
}"""

storage_java = """package com.test.vulnerableapp;

import android.content.Context;
import java.io.FileOutputStream;

public class StorageManager {
    public void savePrefs(Context context) throws Exception {
        // ⚠ World-readable storage mode
        FileOutputStream fos = context.openFileOutput("credentials.txt", Context.MODE_WORLD_READABLE);
        fos.write("secret_data".getBytes());
    }
}"""

def main():
    targets = [
        Path("sample_test_vulnerable_app.apk"),
        Path("public/sample_test_vulnerable_app.apk")
    ]

    for target in targets:
        with zipfile.ZipFile(target, "w") as z:
            z.writestr("AndroidManifest.xml", manifest_content)
            z.writestr("src/com/test/vulnerableapp/AuthManager.java", auth_java)
            z.writestr("src/com/test/vulnerableapp/CryptoService.java", crypto_java)
            z.writestr("src/com/test/vulnerableapp/NetworkClient.java", network_java)
            z.writestr("src/com/test/vulnerableapp/DatabaseHelper.java", db_java)
            z.writestr("src/com/test/vulnerableapp/WebActivity.java", web_java)
            z.writestr("src/com/test/vulnerableapp/StorageManager.java", storage_java)

    print("Fake test APKs generated successfully!")

if __name__ == "__main__":
    main()

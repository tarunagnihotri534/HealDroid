package com.bank.android;

import android.database.sqlite.SQLiteDatabase;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.content.Context;
import java.security.MessageDigest;

/**
 * DECOY — CryptoHelper & WebView with deliberate security flaws.
 */
public class CryptoHelper {

    // ⚠ VULN: Hardcoded encryption key
    private static final String secret = "ThisIsAHardcodedSecretKey12345!@";

    // ⚠ VULN: Using weak hash algorithm (MD5)
    public String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(password.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return password; // ⚠ VULN: Returns plaintext on failure
        }
    }

    // ⚠ VULN: Using SHA1 (deprecated, collision-prone)
    public String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(token.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    // ⚠ VULN: Insecure WebView configuration
    public void setupWebView(Context context) {
        WebView webView = new WebView(context);
        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);           // XSS risk
        settings.setAllowFileAccess(true);             // File access from web
        settings.setAllowFileAccessFromFileURLs(true); // Cross-file access
        settings.setAllowUniversalAccessFromFileURLs(true); // Universal access
        settings.setDomStorageEnabled(true);

        // ⚠ VULN: Loading content over HTTP
        webView.loadUrl("http://insecure-cdn.bank.com/dashboard.html");
    }

    // ⚠ VULN: Storing password in SQLite without encryption
    public void storePassword(SQLiteDatabase db, String user, String pass) {
        db.execSQL("INSERT INTO users (username, password) VALUES ('" + user + "', '" + pass + "')");
    }
}

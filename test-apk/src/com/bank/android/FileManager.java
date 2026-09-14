package com.bank.android;

import android.os.Environment;
import android.content.Context;
import android.content.SharedPreferences;
import java.io.File;
import java.io.FileWriter;
import java.io.FileOutputStream;

/**
 * DECOY — FileManager with deliberate security flaws.
 */
public class FileManager {

    // ⚠ VULN: Hardcoded file paths
    private static final String SECRET_DIR = "/sdcard/SecureBank/secrets/";

    public void saveUserData(Context context, String userData) {
        try {
            // ⚠ VULN [APK-CODE-019]: World-readable external storage
            File dir = Environment.getExternalStorageDirectory();
            File file = new File(dir, "SecureBank/user_data.json");
            file.getParentFile().mkdirs();

            FileWriter writer = new FileWriter(file);
            writer.write(userData);
            writer.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ⚠ VULN: Storing sensitive data on external storage
    public void cacheCredentials(String username, String password) {
        try {
            File cacheFile = new File(Environment.getExternalStorageDirectory(), "SecureBank/.credentials");
            FileWriter writer = new FileWriter(cacheFile);
            writer.write("user=" + username + "\npass=" + password);
            writer.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ⚠ VULN: Storing tokens in world-readable SharedPreferences
    public void saveToken(Context context, String token) {
        SharedPreferences prefs = context.getSharedPreferences("auth", Context.MODE_WORLD_READABLE);
        prefs.edit().putString("access_token", token).apply();
    }

    // ⚠ VULN: Writing encryption keys to external storage
    public void exportEncryptionKey(String key) {
        try {
            File keyFile = new File(Environment.getExternalStorageDirectory(), "SecureBank/encryption.key");
            FileOutputStream fos = new FileOutputStream(keyFile);
            fos.write(key.getBytes());
            fos.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ⚠ VULN: Logging file paths with sensitive data
    public void logStoragePath() {
        File ext = Environment.getExternalStorageDirectory();
        System.out.println("Storage: " + ext.getAbsolutePath());
        System.out.println("Secrets: " + SECRET_DIR);
    }
}

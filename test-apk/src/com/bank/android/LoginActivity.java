package com.bank.android;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * DECOY — LoginActivity with deliberate security flaws.
 */
public class LoginActivity extends Activity {

    // ⚠ VULN [APK-CODE-012]: Hardcoded API key
    private static final String API_KEY = "sk-prod-a8f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5";

    // ⚠ VULN: Hardcoded secret token
    private String secretToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake-token-for-testing";

    // ⚠ VULN: Hardcoded database credentials
    private static final String DB_PASSWORD = "P@ssw0rd!Pr0duction2024";
    private static final String DB_CONNECTION = "jdbc:mysql://prod-db.internal:3306/bankdb?user=admin&password=SuperSecret123";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ⚠ VULN: Logging sensitive data
        Log.d("LoginActivity", "API Key: " + API_KEY);
        Log.d("LoginActivity", "Token: " + secretToken);

        // ⚠ VULN: Cleartext HTTP connection (not HTTPS)
        try {
            URL url = new URL("http://api.bank.com/v1/auth/login");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("Authorization", "Bearer " + API_KEY);
            conn.setRequestProperty("X-Secret-Token", secretToken);
        } catch (Exception e) {
            Log.e("LoginActivity", "Connection failed", e);
        }
    }

    private void authenticateUser(String username, String password) {
        // ⚠ VULN: SQL injection vulnerability
        String query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
        Log.d("LoginActivity", "Query: " + query);
    }
}

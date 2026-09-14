package com.bank.android;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.URL;
import java.security.cert.X509Certificate;

/**
 * DECOY — NetworkClient with deliberate security flaws.
 */
public class NetworkClient {

    // ⚠ VULN [APK-CODE-012]: Hardcoded production API key
    private static final String apiKey = "sk-prod-a8f3b2c1d4e5f6a7b8";

    // ⚠ VULN: Hardcoded AWS credentials
    private static final String AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
    private static final String AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

    // ⚠ VULN: Hardcoded Firebase config
    private String firebaseSecret = "AIzaSyDfakekey1234567890abcdefghijklmno";

    // ⚠ VULN: Hardcoded encryption key
    private static final String ENCRYPTION_KEY = "AES256-STATIC-KEY-DO-NOT-USE-IN-PROD";

    public void makeRequest(String endpoint) {
        try {
            // ⚠ VULN: Cleartext HTTP
            URL url = new URL("http://api.insecure-bank.com/v2/" + endpoint);

            // ⚠ VULN: Trust all certificates — disables SSL verification
            TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return null; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                    public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                }
            };

            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

            // ⚠ VULN: Disable hostname verification
            HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> true);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ⚠ VULN: Sending credentials in URL params
    public String buildAuthUrl(String user) {
        return "http://api.bank.com/auth?apiKey=" + apiKey + "&user=" + user + "&secret=" + AWS_SECRET_KEY;
    }
}

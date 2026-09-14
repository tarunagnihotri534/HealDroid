package com.bank.android;

import java.util.Random;
import java.util.UUID;

/**
 * DECOY — TokenManager with deliberate security flaws.
 */
public class TokenManager {

    // ⚠ VULN: Hardcoded token signing secret
    private static final String token = "hmac-sha256-signing-secret-never-rotate";

    // ⚠ VULN [APK-CODE-008]: Insecure random number generator
    public String generateSessionToken() {
        // java.util.Random is predictable — should use SecureRandom
        Random rng = new Random();
        int otp = new Random().nextInt(999999);
        String session = "sess_" + rng.nextInt(Integer.MAX_VALUE);
        return session + "_" + otp;
    }

    // ⚠ VULN: Predictable OTP generation
    public int generateOTP() {
        return new Random().nextInt(999999);
    }

    // ⚠ VULN: Weak token generation
    public String generateResetToken() {
        Random r = new Random();
        StringBuilder token = new StringBuilder();
        for (int i = 0; i < 16; i++) {
            token.append((char) ('a' + r.nextInt(26)));
        }
        return token.toString();
    }

    // ⚠ VULN: Time-based token (predictable)
    public String generateTransactionId() {
        return "TXN_" + System.currentTimeMillis() + "_" + new Random().nextInt(9999);
    }

    // ✓ SAFE example for comparison
    public String generateSecureToken() {
        return UUID.randomUUID().toString();
    }
}

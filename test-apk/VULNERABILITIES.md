# Decoy APK — com.bank.android

> ⚠ **FOR TESTING ONLY** — This APK contains deliberate security vulnerabilities.

## Embedded Vulnerabilities

| Rule ID | Severity | Vulnerability | File |
|---------|----------|---------------|------|
| APK-MANIF-001 | Critical | `usesCleartextTraffic="true"` | AndroidManifest.xml |
| APK-MANIF-002 | Medium | `debuggable="true"` | AndroidManifest.xml |
| APK-MANIF-003 | Critical | Exported components without permissions | AndroidManifest.xml |
| APK-CODE-012 | High | Hardcoded API keys, AWS creds, Firebase secrets | NetworkClient.java, LoginActivity.java |
| APK-CODE-008 | Medium | `new Random()` for tokens/OTPs | TokenManager.java |
| APK-CODE-019 | Low | `getExternalStorageDirectory()` usage | FileManager.java |
| — | High | Disabled SSL / trust-all-certs | NetworkClient.java |
| — | High | Weak crypto (MD5, SHA-1) | CryptoHelper.java |
| — | Medium | Insecure WebView config | CryptoHelper.java |
| — | Medium | SQL injection | LoginActivity.java, CryptoHelper.java |
| — | Low | Sensitive data logging | LoginActivity.java |
| — | Medium | `MODE_WORLD_READABLE` SharedPreferences | FileManager.java |
| — | Medium | `allowBackup="true"` | AndroidManifest.xml |
| — | High | Excessive permissions (SMS, phone, contacts) | AndroidManifest.xml |

## Expected Scanner Output
- **6+ findings** matching the current HealDroid rule set
- Risk score ≈ 30–45 (Grade D or F)
- OWASP categories hit: M1, M2, M3, M5, M8, M9

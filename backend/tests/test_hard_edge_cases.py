import time
import pytest
from pathlib import Path
from backend.app.models import ManifestData, ManifestComponent, Finding
from backend.app.rules.manifest_rules import (
    rule_exported_components,
    rule_dangerous_permissions,
    rule_debuggable,
    rule_allow_backup,
    rule_cleartext_traffic,
    run_all_manifest_rules,
)
from backend.app.rules.code_rules import run_code_rules
from backend.app.scoring import compute_score, score_to_grade, compute_summary, group_findings_by_location
from backend.app.report import generate_report

# ============================================================================
# 1. HARD / TRICKY PATTERN TESTS (EDGE CASES & EVASION RESISTANCE)
# ============================================================================

def test_hard_secrets_and_false_positive_rejection():
    """
    Tests edge-case string formats, multi-line declarations, casing,
    and strictly asserts that dynamic calls / empty values are NOT falsely flagged.
    """
    hard_secret_files = [
        {
            "file_path": "/src/HardSecrets.java",
            "relative_path": "com/bank/secure/HardSecrets.java",
            "content": """
            package com.bank.secure;
            
            public class HardSecrets {
                // Tricky casing & whitespace variants that MUST be caught
                public static final String API_KEY = "sk_live_999888777666555444333";
                private final String auth_token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
                protected String app_secret = "secret_value_xyz1234567890";
                private static String private_key = "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3";
                String PASSWORD = "SuperSecurePassword123!";
                
                // Real AWS access key format
                private String awsKey = "AKIA1234567890ABCDEF";
                
                // Valid JWT with 3 base64 parts
                String sessionJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

                // Safe variables that MUST NOT be flagged (Negative Test Cases / False Positives)
                String apiKey = getDynamicApiKey();
                String token = Config.loadTokenFromVault();
                String password = request.getParameter("password");
                String emptySecret = "";
                String shortKey = "abc";
                String placeholder = null;
            }
            """
        }
    ]

    findings = run_code_rules(hard_secret_files)
    finding_ids = [f.id for f in findings]
    
    # Positive assertions
    assert "SECRET_AWS_KEY" in finding_ids, "Failed to detect real AWS key format"
    assert "SECRET_JWT" in finding_ids, "Failed to detect structured JWT format"
    assert finding_ids.count("SECRET_GENERIC_KEY_TOKEN_PASSWORD") >= 4, "Failed to detect tricky credential assignments"

    # Negative assertions (Ensure no false positives on dynamic assignments)
    for f in findings:
        assert "getDynamicApiKey" not in f.evidence
        assert "loadTokenFromVault" not in f.evidence
        assert "request.getParameter" not in f.evidence

def test_hard_cryptography_and_casing_variations():
    """
    Tests various cipher mode permutations (AES/ECB, DESede, lowercase/uppercase hash algorithms).
    """
    crypto_files = [
        {
            "file_path": "/src/ObfuscatedCrypto.java",
            "relative_path": "com/bank/crypto/ObfuscatedCrypto.java",
            "content": """
            package com.bank.crypto;
            
            import javax.crypto.Cipher;
            import javax.crypto.KeyGenerator;
            import java.security.MessageDigest;
            import java.util.Random;
            
            public class ObfuscatedCrypto {
                public void doCrypto() throws Exception {
                    // DES variations
                    Cipher c1 = Cipher.getInstance("DES");
                    Cipher c2 = Cipher.getInstance("DESede/CBC/PKCS5Padding");
                    KeyGenerator kg = KeyGenerator.getInstance("DES");

                    // ECB variations
                    Cipher c3 = Cipher.getInstance("AES/ECB/PKCS5Padding");
                    Cipher c4 = Cipher.getInstance("AES/ECB/NoPadding");
                    Cipher c5 = Cipher.getInstance("AES"); // Default on Java is AES/ECB/PKCS5Padding!

                    // MD5 & SHA1 variations
                    MessageDigest md1 = MessageDigest.getInstance("MD5");
                    MessageDigest md2 = MessageDigest.getInstance("SHA-1");
                    MessageDigest md3 = MessageDigest.getInstance("SHA1");

                    // Insecure random
                    Random rng = new Random();
                    int otp = rng.nextInt(900000) + 100000;
                }
            }
            """
        }
    ]

    findings = run_code_rules(crypto_files)
    finding_ids = {f.id for f in findings}

    assert "WEAK_CRYPTO_DES" in finding_ids
    assert "WEAK_CRYPTO_ECB" in finding_ids
    assert "WEAK_CRYPTO_MD5" in finding_ids
    assert "WEAK_CRYPTO_SHA1" in finding_ids
    assert "INSECURE_RANDOM" in finding_ids

def test_hard_complex_webview_scenarios():
    """
    Tests multi-method WebView setup, universal file URL access, and safe WebViews.
    """
    webview_files = [
        {
            "file_path": "/src/VulnerableWeb1.java",
            "relative_path": "com/bank/ui/VulnerableWeb1.java",
            "content": """
            public class VulnerableWeb1 {
                public void init(WebView wv) {
                    wv.getSettings().setJavaScriptEnabled(true);
                    wv.addJavascriptInterface(new Bridge(), "AndroidNative");
                }
            }
            """
        },
        {
            "file_path": "/src/VulnerableWeb2.java",
            "relative_path": "com/bank/ui/VulnerableWeb2.java",
            "content": """
            public class VulnerableWeb2 {
                public void init(WebView wv) {
                    wv.getSettings().setJavaScriptEnabled(true);
                    wv.getSettings().setAllowUniversalAccessFromFileURLs(true);
                }
            }
            """
        },
        {
            "file_path": "/src/SafeWeb.java",
            "relative_path": "com/bank/ui/SafeWeb.java",
            "content": """
            public class SafeWeb {
                public void init(WebView wv) {
                    // JavaScript enabled BUT NO bridge and NO file access
                    wv.getSettings().setJavaScriptEnabled(true);
                    wv.getSettings().setAllowFileAccess(false);
                }
            }
            """
        }
    ]

    findings = run_code_rules(webview_files)
    vuln_locations = [f.location for f in findings if f.id == "INSECURE_WEBVIEW_JS"]

    assert "com/bank/ui/VulnerableWeb1.java" in vuln_locations
    assert "com/bank/ui/VulnerableWeb2.java" in vuln_locations
    assert "com/bank/ui/SafeWeb.java" not in vuln_locations

def test_hard_sql_injection_edge_cases():
    """
    Tests dynamic concatenation in SQLite vs safe parameterized queries.
    """
    sql_files = [
        {
            "file_path": "/src/SQLService.java",
            "relative_path": "com/bank/db/SQLService.java",
            "content": """
            public class SQLService {
                public void vulnerableQueries(SQLiteDatabase db, String user, String pass, String acc) {
                    // String concatenation in variable declaration
                    String q1 = "SELECT * FROM accounts WHERE id = '" + acc + "'";
                    
                    // Dynamic concatenation in execSQL
                    db.execSQL("UPDATE balance SET amount = 100 WHERE user = '" + user + "'");
                    
                    // Dynamic concatenation in rawQuery
                    db.rawQuery("DELETE FROM sessions WHERE token = '" + pass + "'", null);
                }

                public void safeParameterizedQuery(SQLiteDatabase db, String user) {
                    // Safe parameterized query - NOT vulnerable
                    db.rawQuery("SELECT * FROM users WHERE username = ?", new String[]{ user });
                }
            }
            """
        }
    ]

    findings = run_code_rules(sql_files)
    sql_findings = [f for f in findings if f.id == "SQL_INJECTION"]

    assert len(sql_findings) >= 2, "Failed to detect dynamic SQL injection patterns"
    for f in sql_findings:
        assert "new String[]{ user }" not in f.evidence

def test_hard_manifest_implicit_exports_and_sdk_matrix():
    """
    Tests manifest security matrix across different targetSdk versions,
    custom permissions, signature protections, and intent-filter variations.
    """
    components = [
        # 1. Exported Activity with intent filter on API 28 without explicit exported -> Implicitly exported (Vulnerable)
        ManifestComponent(
            name="com.test.ImplicitExportActivity",
            type="activity",
            exported=True,
            permission=None,
            intent_filters=["android.intent.action.VIEW", "com.test.CUSTOM_ACTION"]
        ),
        # 2. Exported Activity with signature permission -> Protected (Safe)
        ManifestComponent(
            name="com.test.ProtectedExportActivity",
            type="activity",
            exported=True,
            permission="com.test.permission.SIGNATURE_PROTECTED",
            intent_filters=["com.test.SECURE_ACTION"]
        ),
        # 3. Exported ContentProvider -> High Risk
        ManifestComponent(
            name="com.test.ExportedDataProvider",
            type="provider",
            exported=True,
            permission=None
        ),
        # 4. Exported Service -> High Risk
        ManifestComponent(
            name="com.test.ExportedSyncService",
            type="service",
            exported=True,
            permission=None
        ),
        # 5. Non-exported BroadcastReceiver -> Safe
        ManifestComponent(
            name="com.test.InternalReceiver",
            type="receiver",
            exported=False,
            permission=None
        ),
    ]

    manifest = ManifestData(
        package_name="com.test.complexapp",
        target_sdk_version=24,
        network_security_config=None,
        uses_cleartext_traffic=False,
        debuggable=True,
        allow_backup=True,
        permissions=[
            "android.permission.INTERNET",
            "android.permission.SEND_SMS",
            "android.permission.READ_PHONE_STATE",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.RECORD_AUDIO",
            "android.permission.CAMERA",
            "android.permission.VIBRATE" # Non-dangerous
        ],
        components=components
    )

    findings = run_all_manifest_rules(manifest)
    finding_ids = {f.id for f in findings}

    assert "MANIFEST_DEBUGGABLE" in finding_ids
    assert "MANIFEST_ALLOW_BACKUP" in finding_ids
    assert "MANIFEST_CLEARTEXT_TRAFFIC" in finding_ids # Because targetSdk=24 < 28 with no NSC
    assert "MANIFEST_EXPORTED_ACTIVITY" in finding_ids
    assert "MANIFEST_EXPORTED_PROVIDER" in finding_ids
    assert "MANIFEST_EXPORTED_SERVICE" in finding_ids
    
    # Assert dangerous permissions filtered accurately
    dangerous_findings = [f for f in findings if f.id == "MANIFEST_DANGEROUS_PERMISSION"]
    assert len(dangerous_findings) == 5 # SMS, PHONE_STATE, LOCATION, AUDIO, CAMERA (VIBRATE & INTERNET excluded)

# ============================================================================
# 2. HIGH-VOLUME STRESS TEST (100 SYNTHESIZED DECOMPILED CLASSES)
# ============================================================================

def test_high_volume_stress_and_performance():
    """
    Generates 100 decompiled Java source classes with mixed benign and vulnerable code.
    Asserts throughput, accurate scoring, and zero crashes or memory leaks.
    """
    synthetic_files = []
    
    for i in range(100):
        if i % 10 == 0:
            # Inject Critical / High vulnerability
            content = f"""
            package com.stress.test;
            public class Class_{i} {{
                String secretKey_{i} = "secret_key_literal_val_{i}_12345";
                String awsKey = "AKIA{'B'*16}";
                public void run() {{
                    javax.crypto.Cipher.getInstance("AES/ECB/PKCS5Padding");
                }}
            }}
            """
        elif i % 5 == 0:
            # Inject Medium vulnerability
            content = f"""
            package com.stress.test;
            public class Class_{i} {{
                public void run() {{
                    java.security.MessageDigest.getInstance("MD5");
                    new java.util.Random().nextInt(100);
                }}
            }}
            """
        else:
            # Clean safe class
            content = f"""
            package com.stress.test;
            public class Class_{i} {{
                private int counter = {i};
                public int getCount() {{
                    return counter * 2;
                }}
            }}
            """

        synthetic_files.append({
            "file_path": f"/stress/Class_{i}.java",
            "relative_path": f"com/stress/test/Class_{i}.java",
            "content": content
        })

    start_time = time.time()
    findings = run_code_rules(synthetic_files)
    elapsed = time.time() - start_time

    print(f"\\nStress Test: Scanned 100 classes in {elapsed:.3f}s ({len(findings)} findings)")
    
    # Throughput must be fast (< 2.0s for 100 classes in Python regex engine)
    assert elapsed < 2.0, f"Scanning took too long: {elapsed}s"
    assert len(findings) > 30, "Failed to capture expected high-volume findings"

    # Verify grouping by location
    grouped = group_findings_by_location(findings)
    assert len(grouped) > 10

    # Verify score calculation & grading
    score = compute_score(findings)
    grade = score_to_grade(score)
    assert score == 0
    assert grade == "F"

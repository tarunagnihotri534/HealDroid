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

def test_manifest_rule_debuggable():
    # Debuggable True -> Finding
    m_debug = ManifestData(debuggable=True)
    findings = rule_debuggable(m_debug)
    assert len(findings) == 1
    assert findings[0].id == "MANIFEST_DEBUGGABLE"
    assert findings[0].severity == "critical"

    # Debuggable False -> No finding
    m_nodebug = ManifestData(debuggable=False)
    assert len(rule_debuggable(m_nodebug)) == 0

def test_manifest_rule_allow_backup():
    m_backup = ManifestData(allow_backup=True)
    findings = rule_allow_backup(m_backup)
    assert len(findings) == 1
    assert findings[0].id == "MANIFEST_ALLOW_BACKUP"

    m_nobackup = ManifestData(allow_backup=False)
    assert len(rule_allow_backup(m_nobackup)) == 0

def test_manifest_rule_exported_components():
    components = [
        # Explicitly exported without permission -> Finding
        ManifestComponent(name="com.test.OpenActivity", type="activity", exported=True, permission=None),
        # Explicitly exported WITH permission -> No finding
        ManifestComponent(name="com.test.ProtectedActivity", type="activity", exported=True, permission="com.test.PERM"),
        # Implicitly exported via intent filter -> Finding
        ManifestComponent(name="com.test.FilterService", type="service", exported=True, permission=None, intent_filters=["ACTION_TEST"]),
        # Not exported -> No finding
        ManifestComponent(name="com.test.InternalReceiver", type="receiver", exported=False, permission=None),
        # Exported provider -> Finding
        ManifestComponent(name="com.test.UserProvider", type="provider", exported=True, permission=None),
    ]
    manifest = ManifestData(components=components)
    findings = rule_exported_components(manifest)
    
    found_ids = [f.id for f in findings]
    assert "MANIFEST_EXPORTED_ACTIVITY" in found_ids
    assert "MANIFEST_EXPORTED_SERVICE" in found_ids
    assert "MANIFEST_EXPORTED_PROVIDER" in found_ids
    assert len(findings) == 3

def test_manifest_rule_dangerous_permissions():
    manifest = ManifestData(permissions=[
        "android.permission.INTERNET",
        "android.permission.SEND_SMS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.VIBRATE"
    ])
    findings = rule_dangerous_permissions(manifest)
    assert len(findings) == 2
    assert all(f.id == "MANIFEST_DANGEROUS_PERMISSION" for f in findings)

def test_manifest_rule_cleartext_traffic():
    # 1. Explicit usesCleartextTraffic="true"
    m1 = ManifestData(uses_cleartext_traffic=True, target_sdk_version=33)
    f1 = rule_cleartext_traffic(m1)
    assert len(f1) == 1
    assert f1[0].id == "MANIFEST_CLEARTEXT_TRAFFIC"
    assert f1[0].severity == "high"

    # 2. Target SDK < 28 without NSC -> High
    m2 = ManifestData(uses_cleartext_traffic=False, target_sdk_version=22, network_security_config=None)
    f2 = rule_cleartext_traffic(m2)
    assert len(f2) == 1
    assert f2[0].id == "MANIFEST_CLEARTEXT_TRAFFIC"

    # 3. Target SDK < 28 WITH NSC -> Medium manual review
    m3 = ManifestData(uses_cleartext_traffic=False, target_sdk_version=22, network_security_config="@xml/net_sec")
    f3 = rule_cleartext_traffic(m3)
    assert len(f3) == 1
    assert f3[0].id == "MANIFEST_CLEARTEXT_NSC_REVIEW"
    assert f3[0].severity == "medium"

    # 4. Target SDK >= 28 without explicit flag -> Safe by default
    m4 = ManifestData(uses_cleartext_traffic=False, target_sdk_version=30)
    assert len(rule_cleartext_traffic(m4)) == 0

def test_code_rule_aws_key():
    files = [{
        "file_path": "/path/Config.java",
        "relative_path": "com/test/Config.java",
        "content": 'String awsKey = "AKIAIOSFODNN7EXAMPLE";'
    }]
    findings = run_code_rules(files)
    assert any(f.id == "SECRET_AWS_KEY" and f.severity == "critical" for f in findings)

def test_code_rule_generic_secrets():
    # Must match literal string assignments
    positive_files = [{
        "file_path": "/path/Keys.java",
        "relative_path": "com/test/Keys.java",
        "content": 'private static final String apiKey = "secret_live_891234567890abcdef";'
    }]
    findings_pos = run_code_rules(positive_files)
    assert any(f.id == "SECRET_GENERIC_KEY_TOKEN_PASSWORD" for f in findings_pos)

    # Must NOT match dynamic method calls or variables
    negative_files = [{
        "file_path": "/path/Service.java",
        "relative_path": "com/test/Service.java",
        "content": 'String apiKey = getApiKey();\nString password = request.getPassword();'
    }]
    findings_neg = run_code_rules(negative_files)
    assert not any(f.id == "SECRET_GENERIC_KEY_TOKEN_PASSWORD" for f in findings_neg)

def test_code_rule_jwt():
    files = [{
        "file_path": "/path/Auth.java",
        "relative_path": "com/test/Auth.java",
        "content": 'String token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozGz...";'
    }]
    findings = run_code_rules(files)
    assert any(f.id == "SECRET_JWT" for f in findings)

def test_code_rule_insecure_webview_js():
    # Both present -> Finding
    pos_file = [{
        "file_path": "/path/WebActivity.java",
        "relative_path": "com/test/WebActivity.java",
        "content": """
            webView.getSettings().setJavaScriptEnabled(true);
            webView.addJavascriptInterface(new JsObject(), "AndroidBridge");
        """
    }]
    findings = run_code_rules(pos_file)
    assert any(f.id == "INSECURE_WEBVIEW_JS" and f.severity == "critical" for f in findings)

    # Only one present -> No finding
    neg_file = [{
        "file_path": "/path/SafeWeb.java",
        "relative_path": "com/test/SafeWeb.java",
        "content": 'webView.getSettings().setJavaScriptEnabled(true);'
    }]
    findings_neg = run_code_rules(neg_file)
    assert not any(f.id == "INSECURE_WEBVIEW_JS" for f in findings_neg)

def test_code_rule_weak_crypto():
    files = [{
        "file_path": "/path/Crypto.java",
        "relative_path": "com/test/Crypto.java",
        "content": """
            Cipher c1 = Cipher.getInstance("DES/CBC/PKCS5Padding");
            Cipher c2 = Cipher.getInstance("AES/ECB/NoPadding");
            MessageDigest md = MessageDigest.getInstance("MD5");
            MessageDigest sha = MessageDigest.getInstance("SHA-1");
        """
    }]
    findings = run_code_rules(files)
    found_ids = {f.id for f in findings}
    assert "WEAK_CRYPTO_DES" in found_ids
    assert "WEAK_CRYPTO_ECB" in found_ids
    assert "WEAK_CRYPTO_MD5" in found_ids
    assert "WEAK_CRYPTO_SHA1" in found_ids

def test_code_rule_unencrypted_sqlite():
    # Standard SQLite without SQLCipher -> Finding
    pos_file = [{
        "file_path": "/path/DB.java",
        "relative_path": "com/test/DB.java",
        "content": "class DBHelper extends SQLiteOpenHelper { SQLiteDatabase db; }"
    }]
    findings_pos = run_code_rules(pos_file)
    assert any(f.id == "UNENCRYPTED_SQLITE" for f in findings_pos)

    # SQLite with SQLCipher -> No finding
    neg_file = [{
        "file_path": "/path/EncryptedDB.java",
        "relative_path": "com/test/EncryptedDB.java",
        "content": "import net.sqlcipher.database.SQLiteDatabase; class EncryptedDB extends SQLiteOpenHelper { }"
    }]
    findings_neg = run_code_rules(neg_file)
    assert not any(f.id == "UNENCRYPTED_SQLITE" for f in findings_neg)

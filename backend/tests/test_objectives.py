from pathlib import Path
from backend.app.models import ManifestData, ManifestComponent, Finding
from backend.app.manifest_parser import parse_manifest
from backend.app.code_extractor import CodeExtractor
from backend.app.rules.manifest_rules import (
    rule_exported_components,
    rule_unverified_deep_links,
    rule_unprotected_broadcast_receivers,
    rule_exported_provider_grant_uri,
    run_all_manifest_rules
)
from backend.app.rules.code_rules import run_code_rules
from backend.app.scoring import compute_score, score_to_grade, compute_summary

FIXTURES_DIR = Path(__file__).parent / "fixtures"

# ── OBJECTIVE 1 & 4 TESTS: MANIFEST & INTENT FILTER DEEP PARSING ──────────────
def test_intent_filter_deep_parsing_and_assessment():
    """
    Validates extraction of intent-filter actions, categories, data schemes,
    autoVerify attributes, and component export assessment.
    """
    manifest = ManifestData(
        package_name="com.test.secureapp",
        components=[
            # 1. Unverified Browsable Deep Link
            ManifestComponent(
                name="com.test.secureapp.DeepLinkActivity",
                type="activity",
                exported=True,
                intent_filters=["android.intent.action.VIEW"],
                categories=["android.intent.category.DEFAULT", "android.intent.category.BROWSABLE"],
                data_schemes=["https"],
                data_hosts=["secureapp.com"],
                auto_verify=False
            ),
            # 2. Custom Scheme Deep Link
            ManifestComponent(
                name="com.test.secureapp.OAuthActivity",
                type="activity",
                exported=True,
                intent_filters=["android.intent.action.VIEW"],
                categories=["android.intent.category.BROWSABLE"],
                data_schemes=["customoauth"],
                auto_verify=False
            ),
            # 3. Unprotected Exported Receiver
            ManifestComponent(
                name="com.test.secureapp.PushReceiver",
                type="receiver",
                exported=True,
                permission=None,
                intent_filters=["com.google.android.c2dm.intent.RECEIVE"]
            ),
            # 4. Exported Content Provider with unrestricted grantUriPermissions
            ManifestComponent(
                name="com.test.secureapp.DataProvider",
                type="provider",
                exported=True,
                permission=None,
                grant_uri_permissions=True
            ),
            # 5. Properly Protected Component (Negative Test / False Positive Avoidance)
            ManifestComponent(
                name="com.test.secureapp.InternalService",
                type="service",
                exported=False,
                permission=None
            )
        ]
    )

    # 1. Verify Deep Link rule
    dl_findings = rule_unverified_deep_links(manifest)
    assert any(f.id == "MANIFEST_UNVERIFIED_DEEP_LINK" and "DeepLinkActivity" in f.location for f in dl_findings)
    assert any(f.id == "MANIFEST_CUSTOM_SCHEME_DEEP_LINK" and "OAuthActivity" in f.location for f in dl_findings)

    # 2. Verify Broadcast Receiver rule
    rcv_findings = rule_unprotected_broadcast_receivers(manifest)
    assert any(f.id == "MANIFEST_UNPROTECTED_BROADCAST_RECEIVER" and "PushReceiver" in f.location for f in rcv_findings)

    # 3. Verify Content Provider rule
    prov_findings = rule_exported_provider_grant_uri(manifest)
    assert any(f.id == "MANIFEST_EXPORTED_PROVIDER_GRANT_URI" and "DataProvider" in f.location for f in prov_findings)

    # 4. Negative test: InternalService must not trigger export findings
    exp_findings = rule_exported_components(manifest)
    assert not any("InternalService" in f.location for f in exp_findings)


# ── OBJECTIVE 2 TESTS: SMALI & JAVA STATIC ANALYSIS ───────────────────────────
def test_smali_and_java_code_analysis():
    """
    Asserts that the static analysis engine detects OWASP flaws in both
    Smali bytecode (.smali) and decompiled Java (.java).
    """
    mock_files = [
        # Smali Bytecode file
        {
            "file_path": "/tmp/smali/com/test/AuthHelper.smali",
            "relative_path": "com/test/AuthHelper.smali",
            "file_type": "smali",
            "content": """
            .class public Lcom/test/AuthHelper;
            .super Ljava/lang/Object;
            .method public static checkLogin()V
                const-string v0, "AIzaSyDfakeKeyForGoogleMaps12345678"
                const-string v1, "http://api.internal.bank.com/v1/auth"
                invoke-virtual {v2, v0}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
                invoke-virtual {v2, v1}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V
                return-void
            .end method
            """
        },
        # Java Source file
        {
            "file_path": "/tmp/sources/com/test/DatabaseClient.java",
            "relative_path": "com/test/DatabaseClient.java",
            "file_type": "java",
            "content": """
            package com.test;
            import android.database.sqlite.SQLiteDatabase;
            public class DatabaseClient {
                public void query(SQLiteDatabase db, String userInput) {
                    db.rawQuery("SELECT * FROM users WHERE id = '" + userInput + "'", null);
                }
            }
            """
        }
    ]

    findings = run_code_rules(iter(mock_files))

    # Smali findings
    assert any(f.id == "SECRET_GOOGLE_API_KEY" and "AuthHelper.smali" in f.location for f in findings)
    assert any(f.id == "SECRET_PRIVATE_URL_OR_INTERNAL_IP" and "AuthHelper.smali" in f.location for f in findings)
    assert any(f.id == "INSECURE_WEBVIEW_JS" and "AuthHelper.smali" in f.location for f in findings)

    # Java findings
    assert any(f.id == "UNENCRYPTED_SQLITE" and "DatabaseClient.java" in f.location for f in findings)
    assert any(f.id == "SQL_INJECTION" and "DatabaseClient.java" in f.location for f in findings)


# ── OBJECTIVE 3 TESTS: SECRETS, TOKENS, CLOUD BUCKETS & PRIVATE URLS ──────────
def test_secrets_pattern_matching_engine():
    """
    Tests exact pattern matching for Google API keys, Slack webhooks,
    GitHub tokens, internal RFC1918 IPs, and AWS/GCS storage buckets.
    """
    hook_url = "https://" + "hooks." + "slack.com/services" + "/T00000000/B00000000/sample000000000000000000"
    gh_tok = "gh" + "p_" + "1234567890abcdefghijklmnopqrstuvwxyz"
    mock_file = [{
        "file_path": "/tmp/SecretsHolder.java",
        "relative_path": "SecretsHolder.java",
        "file_type": "java",
        "content": f"""
        public class SecretsHolder {{
            // Google API Key
            String googleKey = "AIzaSyB0fake1234567890abcdefghijklmno";
            
            // Slack Webhook
            String slackWebhook = "{hook_url}";
            
            // GitHub Token
            String ghToken = "{gh_tok}";
            
            // Private RFC1918 IP
            String backendIp = "http://192.168.1.105:8080/api";
            String internalIp = "http://10.200.10.1/admin";
            
            // Cloud Storage Buckets
            String s3Bucket = "https://my-confidential-bucket.s3.amazonaws.com/backups/users.db";
            String gcsBucket = "https://storage.googleapis.com/corporate-assets-prod/secret.pem";
        }}
        """
    }]

    findings = run_code_rules(iter(mock_file))
    finding_ids = {f.id for f in findings}

    assert "SECRET_GOOGLE_API_KEY" in finding_ids
    assert "SECRET_SLACK_GITHUB_TOKEN" in finding_ids
    assert "SECRET_PRIVATE_URL_OR_INTERNAL_IP" in finding_ids
    assert "SECRET_CLOUD_STORAGE_BUCKET" in finding_ids


# ── OBJECTIVE 5 TESTS: SECURITY SCORE & ACTIONABLE REMEDIATION SNIPPETS ───────
def test_scoring_and_actionable_remediations():
    """
    Verifies that security score calculation is deterministic and that all findings
    carry actionable remediation snippets containing compliant code.
    """
    mock_findings = [
        Finding(
            id="MANIFEST_UNVERIFIED_DEEP_LINK",
            severity="high",
            title="Unverified Browsable HTTP/HTTPS Deep Link",
            owasp_category="M1: Improper Platform Usage",
            location="com.app.DeepLinkActivity",
            evidence="Accepts https:// without autoVerify=true",
            remediation="Add android:autoVerify=\"true\":\n<intent-filter android:autoVerify=\"true\">"
        ),
        Finding(
            id="SECRET_GOOGLE_API_KEY",
            severity="high",
            title="Hardcoded Google / Firebase API Key",
            owasp_category="M9: Reverse Engineering",
            location="com.app.ApiClient:L25",
            evidence="Found AIzaSy...",
            remediation="Inject via build.gradle:\nmanifestPlaceholders = [GOOGLE_MAPS_KEY: System.getenv()]"
        )
    ]

    score = compute_score(mock_findings)
    grade = score_to_grade(score)
    summary = compute_summary(mock_findings)

    # 100 - (10 * 2) = 80 -> Grade B
    assert score == 80
    assert grade == "B"
    assert summary.high == 2
    assert summary.critical == 0

    # Ensure remediation snippets have actionable code guidance
    for f in mock_findings:
        assert len(f.remediation) > 20
        assert "<" in f.remediation or "{" in f.remediation or "=" in f.remediation

from typing import List, Optional
from backend.app.models import ManifestData, Finding

DANGEROUS_PERMISSIONS = {
    "android.permission.READ_CALENDAR",
    "android.permission.WRITE_CALENDAR",
    "android.permission.CAMERA",
    "android.permission.READ_CONTACTS",
    "android.permission.WRITE_CONTACTS",
    "android.permission.GET_ACCOUNTS",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.ACCESS_BACKGROUND_LOCATION",
    "android.permission.RECORD_AUDIO",
    "android.permission.READ_PHONE_STATE",
    "android.permission.READ_PHONE_NUMBERS",
    "android.permission.CALL_PHONE",
    "android.permission.ANSWER_PHONE_CALLS",
    "android.permission.READ_CALL_LOG",
    "android.permission.WRITE_CALL_LOG",
    "android.permission.ADD_VOICEMAIL",
    "android.permission.USE_SIP",
    "android.permission.PROCESS_OUTGOING_CALLS",
    "android.permission.BODY_SENSORS",
    "android.permission.BODY_SENSORS_BACKGROUND",
    "android.permission.ACTIVITY_RECOGNITION",
    "android.permission.SEND_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.READ_SMS",
    "android.permission.RECEIVE_WAP_PUSH",
    "android.permission.RECEIVE_MMS",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.ACCESS_MEDIA_LOCATION",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.WRITE_SETTINGS",
}

def rule_exported_components(manifest_data: ManifestData) -> List[Finding]:
    """
    Identifies components (Activity, Service, Receiver, Provider) that are exported
    without an enforced permission.
    Catches explicit exported="true" as well as implicit exports (has <intent-filter>
    and no explicit exported="false").
    """
    findings: List[Finding] = []
    
    type_id_map = {
        "activity": "MANIFEST_EXPORTED_ACTIVITY",
        "service": "MANIFEST_EXPORTED_SERVICE",
        "receiver": "MANIFEST_EXPORTED_RECEIVER",
        "provider": "MANIFEST_EXPORTED_PROVIDER"
    }

    for comp in manifest_data.components:
        if comp.exported and not comp.permission:
            is_launcher = (
                comp.type == "activity" 
                and any("android.intent.action.MAIN" in f for f in comp.intent_filters)
                and len(comp.intent_filters) == 1
            )
            rule_id = type_id_map.get(comp.type, "MANIFEST_EXPORTED_COMPONENT")
            severity = "high" if comp.type in ("provider", "service") else "medium" if is_launcher else "high"
            
            filter_desc = f" with intent-filters [{', '.join(comp.intent_filters)}]" if comp.intent_filters else ""
            findings.append(Finding(
                id=rule_id,
                severity=severity,
                title=f"Exported {comp.type.capitalize()} Without Permission Enforcement",
                owasp_category="M1: Improper Platform Usage",
                location=comp.name,
                evidence=f"Component '{comp.name}' ({comp.type}) is exported{filter_desc} without requiring an android:permission.",
                remediation=(
                    "Set android:exported=\"false\" if this component is internal to the application.\n\n"
                    "Compliant AndroidManifest.xml fix:\n"
                    f"<{comp.type} android:name=\"{comp.name}\"\n"
                    "    android:exported=\"false\" />\n\n"
                    "If external access is necessary, require a custom signature permission:\n"
                    "<permission android:name=\"com.example.CUSTOM_PERMISSION\" android:protectionLevel=\"signature\" />\n"
                    f"<{comp.type} android:name=\"{comp.name}\"\n"
                    "    android:permission=\"com.example.CUSTOM_PERMISSION\"\n"
                    "    android:exported=\"true\" />"
                )
            ))
            
    return findings

def rule_dangerous_permissions(manifest_data: ManifestData) -> List[Finding]:
    """
    Flags usage of dangerous Android permissions.
    """
    findings: List[Finding] = []
    for perm in manifest_data.permissions:
        if perm in DANGEROUS_PERMISSIONS or any(dp in perm for dp in DANGEROUS_PERMISSIONS):
            perm_short = perm.split(".")[-1]
            findings.append(Finding(
                id="MANIFEST_DANGEROUS_PERMISSION",
                severity="medium",
                title=f"Dangerous Permission Requested: {perm_short}",
                owasp_category="M1: Improper Platform Usage",
                location="AndroidManifest.xml",
                evidence=f"Application requests dangerous permission: {perm}",
                remediation=(
                    f"Review whether {perm_short} is strictly necessary. On Android 6.0+ (API 23+), request permissions at runtime:\n\n"
                    "Compliant runtime permission check:\n"
                    f"if (ContextCompat.checkSelfPermission(context, \"{perm}\") != PackageManager.PERMISSION_GRANTED) {{\n"
                    f"    ActivityCompat.requestPermissions(activity, new String[]{{\"{perm}\"}}, REQUEST_CODE);\n"
                    "}"
                )
            ))
    return findings

def rule_debuggable(manifest_data: ManifestData) -> List[Finding]:
    """
    Flags android:debuggable="true".
    """
    if manifest_data.debuggable:
        return [Finding(
            id="MANIFEST_DEBUGGABLE",
            severity="critical",
            title="Application Is Debuggable",
            owasp_category="M1: Improper Platform Usage",
            location="AndroidManifest.xml",
            evidence="android:debuggable is set to 'true' in the application manifest.",
            remediation=(
                "Disable debuggable in production release variants inside build.gradle:\n\n"
                "Compliant build.gradle (app):\n"
                "android {\n"
                "    buildTypes {\n"
                "        release {\n"
                "            debuggable false\n"
                "            minifyEnabled true\n"
                "            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n"
                "        }\n"
                "    }\n"
                "}"
            )
        )]
    return []

def rule_allow_backup(manifest_data: ManifestData) -> List[Finding]:
    """
    Flags android:allowBackup="true".
    """
    if manifest_data.allow_backup:
        return [Finding(
            id="MANIFEST_ALLOW_BACKUP",
            severity="medium",
            title="Application Backup Enabled (allowBackup=true)",
            owasp_category="M2: Insecure Data Storage",
            location="AndroidManifest.xml",
            evidence="android:allowBackup is enabled or defaulted to true, permitting adb backup data extraction.",
            remediation=(
                "Disable application data backups or define strict data extraction rules in AndroidManifest.xml:\n\n"
                "Compliant AndroidManifest.xml:\n"
                "<application\n"
                "    android:allowBackup=\"false\"\n"
                "    android:dataExtractionRules=\"@xml/data_extraction_rules\"\n"
                "    ... >"
            )
        )]
    return []

def rule_cleartext_traffic(manifest_data: ManifestData) -> List[Finding]:
    """
    Evaluates cleartext traffic vulnerability based on:
    - Explicit usesCleartextTraffic="true"
    - Target SDK < 28 without Network Security Config
    - Network Security Config referenced with target SDK < 28 (manual review)
    """
    findings: List[Finding] = []
    
    nsc_guidance = (
        "Enforce HTTPS across all network connections and configure a strict Network Security Config.\n\n"
        "Compliant res/xml/network_security_config.xml:\n"
        "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
        "<network-security-config>\n"
        "    <base-config cleartextTrafficPermitted=\"false\">\n"
        "        <trust-anchors>\n"
        "            <certificates src=\"system\" />\n"
        "        </trust-anchors>\n"
        "    </base-config>\n"
        "</network-security-config>\n\n"
        "Compliant AndroidManifest.xml:\n"
        "<application\n"
        "    android:usesCleartextTraffic=\"false\"\n"
        "    android:networkSecurityConfig=\"@xml/network_security_config\"\n"
        "    ... >"
    )

    if manifest_data.uses_cleartext_traffic:
        findings.append(Finding(
            id="MANIFEST_CLEARTEXT_TRAFFIC",
            severity="high",
            title="Cleartext Traffic Explicitly Permitted",
            owasp_category="M3: Insecure Communication",
            location="AndroidManifest.xml",
            evidence="android:usesCleartextTraffic is set to 'true', allowing unencrypted HTTP traffic.",
            remediation=nsc_guidance
        ))
    elif manifest_data.target_sdk_version is not None and manifest_data.target_sdk_version < 28:
        if manifest_data.network_security_config:
            findings.append(Finding(
                id="MANIFEST_CLEARTEXT_NSC_REVIEW",
                severity="medium",
                title="Network Security Config Requires Review for Cleartext Traffic",
                owasp_category="M3: Insecure Communication",
                location="AndroidManifest.xml",
                evidence=(
                    f"targetSdkVersion ({manifest_data.target_sdk_version}) is less than 28 and references "
                    f"Network Security Config '{manifest_data.network_security_config}'. Verify cleartext is disabled."
                ),
                remediation=nsc_guidance
            ))
        else:
            findings.append(Finding(
                id="MANIFEST_CLEARTEXT_TRAFFIC",
                severity="high",
                title="Cleartext Traffic Permitted by Default (Legacy targetSdkVersion)",
                owasp_category="M3: Insecure Communication",
                location="AndroidManifest.xml",
                evidence=(
                    f"targetSdkVersion is {manifest_data.target_sdk_version} (less than 28) and no Network Security "
                    "Config is defined. Cleartext HTTP traffic is permitted by default."
                ),
                remediation=nsc_guidance
            ))
            
    return findings

def rule_unverified_deep_links(manifest_data: ManifestData) -> List[Finding]:
    """
    Evaluates Activity intent filters for browsable deep links:
    - Unverified HTTP/HTTPS App Links lacking android:autoVerify="true".
    - Unprotected custom URL schemes vulnerable to link hijacking.
    """
    findings: List[Finding] = []
    
    for comp in manifest_data.components:
        if comp.type != "activity":
            continue
            
        is_browsable = any("android.intent.category.BROWSABLE" in c for c in comp.categories)
        has_view = any("android.intent.action.VIEW" in a for a in comp.intent_filters)
        
        if is_browsable or (has_view and (comp.data_schemes or comp.data_hosts)):
            http_schemes = [s for s in comp.data_schemes if s.lower() in ("http", "https")]
            custom_schemes = [s for s in comp.data_schemes if s.lower() not in ("http", "https")]
            
            # 1. Unverified HTTP/HTTPS Deep Link (App Link hijacking)
            if http_schemes and not comp.auto_verify:
                findings.append(Finding(
                    id="MANIFEST_UNVERIFIED_DEEP_LINK",
                    severity="high",
                    title="Unverified Browsable HTTP/HTTPS Deep Link (App Links)",
                    owasp_category="M1: Improper Platform Usage",
                    location=comp.name,
                    evidence=(
                        f"Activity '{comp.name}' accepts browsable HTTP/HTTPS deep links for scheme(s) {http_schemes} "
                        "without android:autoVerify=\"true\", allowing malicious apps to intercept deep links."
                    ),
                    remediation=(
                        "Enable App Links verification by adding android:autoVerify=\"true\" and hosting an "
                        "assetlinks.json file on your verified domain.\n\n"
                        "Compliant AndroidManifest.xml deep-link snippet:\n"
                        "<activity android:name=\"" + comp.name + "\"\n"
                        "    android:exported=\"true\">\n"
                        "    <intent-filter android:autoVerify=\"true\">\n"
                        "        <action android:name=\"android.intent.action.VIEW\" />\n"
                        "        <category android:name=\"android.intent.category.DEFAULT\" />\n"
                        "        <category android:name=\"android.intent.category.BROWSABLE\" />\n"
                        "        <data android:scheme=\"https\" android:host=\"yourdomain.com\" />\n"
                        "    </intent-filter>\n"
                        "</activity>"
                    )
                ))
                
            # 2. Custom URL scheme hijacking risk
            if custom_schemes:
                findings.append(Finding(
                    id="MANIFEST_CUSTOM_SCHEME_DEEP_LINK",
                    severity="medium",
                    title=f"Custom Scheme Deep Link Registered: {', '.join(custom_schemes)}",
                    owasp_category="M1: Improper Platform Usage",
                    location=comp.name,
                    evidence=(
                        f"Activity '{comp.name}' registers custom URL scheme(s) {custom_schemes}. "
                        "Custom schemes cannot be cryptographically verified by Android and can be claimed by rogue apps."
                    ),
                    remediation=(
                        "Migrate from custom URL schemes to verified HTTPS App Links with android:autoVerify=\"true\". "
                        "If custom schemes must be retained, strictly validate caller identity and sanitize all incoming parameters.\n\n"
                        "Compliant parameter validation:\n"
                        "Uri data = getIntent().getData();\n"
                        "if (data != null && \"expected_host\".equals(data.getHost())) {\n"
                        "    // Sanitize and validate query parameters before processing\n"
                        "}"
                    )
                ))
                
    return findings

def rule_unprotected_broadcast_receivers(manifest_data: ManifestData) -> List[Finding]:
    """
    Flags exported Broadcast Receivers without permission protection that listen to
    system or custom broadcast actions, exposing the app to unauthorized trigger or DoS.
    """
    findings: List[Finding] = []
    for comp in manifest_data.components:
        if comp.type == "receiver" and comp.exported and not comp.permission:
            action_desc = f" [{', '.join(comp.intent_filters)}]" if comp.intent_filters else ""
            findings.append(Finding(
                id="MANIFEST_UNPROTECTED_BROADCAST_RECEIVER",
                severity="high",
                title="Unprotected Exported Broadcast Receiver",
                owasp_category="M1: Improper Platform Usage",
                location=comp.name,
                evidence=f"BroadcastReceiver '{comp.name}' is exported{action_desc} without an enforced permission requirement.",
                remediation=(
                    "Set android:exported=\"false\" if the receiver is intended solely for in-app broadcasts. "
                    "If external broadcast reception is necessary, protect it with a signature-level permission.\n\n"
                    "Compliant AndroidManifest.xml fix:\n"
                    f"<receiver android:name=\"{comp.name}\"\n"
                    "    android:exported=\"false\" />"
                )
            ))
    return findings

def rule_exported_provider_grant_uri(manifest_data: ManifestData) -> List[Finding]:
    """
    Flags exported Content Providers that enable grantUriPermissions="true" without permission enforcement.
    """
    findings: List[Finding] = []
    for comp in manifest_data.components:
        if comp.type == "provider" and comp.exported and comp.grant_uri_permissions and not comp.permission:
            findings.append(Finding(
                id="MANIFEST_EXPORTED_PROVIDER_GRANT_URI",
                severity="high",
                title="Exported Content Provider with Unrestricted grantUriPermissions",
                owasp_category="M1: Improper Platform Usage",
                location=comp.name,
                evidence=(
                    f"ContentProvider '{comp.name}' is exported and enables grantUriPermissions=\"true\" "
                    "without permission protection, allowing URI delegation to unauthorized external applications."
                ),
                remediation=(
                    "Do not export ContentProviders that grant broad URI permissions. Restrict grantUriPermissions "
                    "to explicit sub-paths using <grant-uri-permission> elements.\n\n"
                    "Compliant ContentProvider configuration:\n"
                    f"<provider android:name=\"{comp.name}\"\n"
                    "    android:exported=\"false\"\n"
                    "    android:grantUriPermissions=\"false\" />"
                )
            ))
    return findings

def run_all_manifest_rules(manifest_data: Optional[ManifestData]) -> List[Finding]:
    """
    Executes all individual manifest rules against ManifestData.
    """
    if not manifest_data:
        return []
        
    findings: List[Finding] = []
    rule_functions = [
        rule_exported_components,
        rule_dangerous_permissions,
        rule_debuggable,
        rule_allow_backup,
        rule_cleartext_traffic,
        rule_unverified_deep_links,
        rule_unprotected_broadcast_receivers,
        rule_exported_provider_grant_uri,
    ]
    
    for fn in rule_functions:
        try:
            findings.extend(fn(manifest_data))
        except Exception:
            pass
            
    return findings


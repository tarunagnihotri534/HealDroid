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
    ]
    
    for fn in rule_functions:
        try:
            findings.extend(fn(manifest_data))
        except Exception:
            pass
            
    return findings

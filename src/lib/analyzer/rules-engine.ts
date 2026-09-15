import { Finding, ManifestData, SeverityLevel } from "./types";
import { RULE_DEFINITIONS } from "./rules-data";

export const DANGEROUS_PERMISSIONS = new Set([
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
]);

export interface CodeFile {
  relative_path: string;
  content: string;
}

export function runManifestRules(manifest: ManifestData | null): Finding[] {
  if (!manifest) return [];
  const findings: Finding[] = [];

  // 1. Exported components without permission
  const typeIdMap: Record<string, string> = {
    activity: "MANIFEST_EXPORTED_ACTIVITY",
    service: "MANIFEST_EXPORTED_SERVICE",
    receiver: "MANIFEST_EXPORTED_RECEIVER",
    provider: "MANIFEST_EXPORTED_PROVIDER",
  };

  for (const comp of manifest.components) {
    if (comp.exported && !comp.permission) {
      const isLauncher =
        comp.type === "activity" &&
        comp.intent_filters.some((f) => f.includes("android.intent.action.MAIN")) &&
        comp.intent_filters.length === 1;

      const ruleId = typeIdMap[comp.type] || "MANIFEST_EXPORTED_COMPONENT";
      const severity: SeverityLevel = comp.type === "provider" || comp.type === "service" ? "high" : isLauncher ? "medium" : "high";
      const filterDesc = comp.intent_filters.length > 0 ? ` with intent-filters [${comp.intent_filters.join(", ")}]` : "";

      findings.push({
        id: ruleId,
        severity,
        title: `Exported ${comp.type.charAt(0).toUpperCase() + comp.type.slice(1)} Without Permission Enforcement`,
        owasp_category: "M1: Improper Platform Usage",
        location: comp.name,
        evidence: `Component '${comp.name}' (${comp.type}) is exported${filterDesc} without requiring an android:permission.`,
        remediation: `Set android:exported="false" if this component is internal to the application.\n\nCompliant AndroidManifest.xml fix:\n<${comp.type} android:name="${comp.name}"\n    android:exported="false" />\n\nIf external access is necessary, require a custom signature permission:\n<permission android:name="com.example.CUSTOM_PERMISSION" android:protectionLevel="signature" />\n<${comp.type} android:name="${comp.name}"\n    android:permission="com.example.CUSTOM_PERMISSION"\n    android:exported="true" />`,
      });
    }
  }

  // 2. Dangerous permissions
  for (const perm of manifest.permissions) {
    const isDangerous = DANGEROUS_PERMISSIONS.has(perm) || Array.from(DANGEROUS_PERMISSIONS).some((dp) => perm.includes(dp));
    if (isDangerous) {
      const permShort = perm.split(".").pop() || perm;
      findings.push({
        id: "MANIFEST_DANGEROUS_PERMISSION",
        severity: "medium",
        title: `Dangerous Permission Requested: ${permShort}`,
        owasp_category: "M1: Improper Platform Usage",
        location: "AndroidManifest.xml",
        evidence: `Application requests dangerous permission: ${perm}`,
        remediation: `Review whether ${permShort} is strictly necessary. On Android 6.0+ (API 23+), request permissions at runtime:\n\nCompliant runtime permission check:\nif (ContextCompat.checkSelfPermission(context, "${perm}") != PackageManager.PERMISSION_GRANTED) {\n    ActivityCompat.requestPermissions(activity, new String[]{"${perm}"}, REQUEST_CODE);\n}`,
      });
    }
  }

  // 3. Debuggable flag
  if (manifest.debuggable) {
    findings.push({
      id: "MANIFEST_DEBUGGABLE",
      severity: "critical",
      title: "Application Is Debuggable",
      owasp_category: "M1: Improper Platform Usage",
      location: "AndroidManifest.xml",
      evidence: "android:debuggable is set to 'true' in the application manifest.",
      remediation: "Disable debuggable in production release variants inside build.gradle:\n\nCompliant build.gradle (app):\nandroid {\n    buildTypes {\n        release {\n            debuggable false\n            minifyEnabled true\n            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n        }\n    }\n}",
    });
  }

  // 4. Allow backup
  if (manifest.allow_backup) {
    findings.push({
      id: "MANIFEST_ALLOW_BACKUP",
      severity: "medium",
      title: "Application Backup Enabled (allowBackup=true)",
      owasp_category: "M2: Insecure Data Storage",
      location: "AndroidManifest.xml",
      evidence: "android:allowBackup is enabled or defaulted to true, permitting adb backup data extraction.",
      remediation: "Disable application data backups or define strict data extraction rules in AndroidManifest.xml:\n\nCompliant AndroidManifest.xml:\n<application\n    android:allowBackup=\"false\"\n    android:dataExtractionRules=\"@xml/data_extraction_rules\"\n    ... >",
    });
  }

  // 5. Cleartext traffic
  const nscGuidance = "Enforce HTTPS across all network connections and configure a strict Network Security Config.\n\nCompliant res/xml/network_security_config.xml:\n<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<network-security-config>\n    <base-config cleartextTrafficPermitted=\"false\">\n        <trust-anchors>\n            <certificates src=\"system\" />\n        </trust-anchors>\n    </base-config>\n</network-security-config>\n\nCompliant AndroidManifest.xml:\n<application\n    android:usesCleartextTraffic=\"false\"\n    android:networkSecurityConfig=\"@xml/network_security_config\"\n    ... >";

  if (manifest.uses_cleartext_traffic) {
    findings.push({
      id: "MANIFEST_CLEARTEXT_TRAFFIC",
      severity: "high",
      title: "Cleartext Traffic Explicitly Permitted",
      owasp_category: "M3: Insecure Communication",
      location: "AndroidManifest.xml",
      evidence: "android:usesCleartextTraffic is set to 'true', allowing unencrypted HTTP traffic.",
      remediation: nscGuidance,
    });
  } else if (manifest.target_sdk_version !== null && manifest.target_sdk_version !== undefined && manifest.target_sdk_version < 28) {
    if (manifest.network_security_config) {
      findings.push({
        id: "MANIFEST_CLEARTEXT_NSC_REVIEW",
        severity: "medium",
        title: "Network Security Config Requires Review for Cleartext Traffic",
        owasp_category: "M3: Insecure Communication",
        location: "AndroidManifest.xml",
        evidence: `targetSdkVersion (${manifest.target_sdk_version}) is less than 28 and references Network Security Config '${manifest.network_security_config}'. Verify cleartext is disabled.`,
        remediation: nscGuidance,
      });
    } else {
      findings.push({
        id: "MANIFEST_CLEARTEXT_TRAFFIC",
        severity: "high",
        title: "Cleartext Traffic Permitted by Default (Legacy targetSdkVersion)",
        owasp_category: "M3: Insecure Communication",
        location: "AndroidManifest.xml",
        evidence: `targetSdkVersion is ${manifest.target_sdk_version} (less than 28) and no Network Security Config is defined. Cleartext HTTP traffic is permitted by default.`,
        remediation: nscGuidance,
      });
    }
  }

  return findings;
}

function extractLineSnippet(content: string, matchPos: number, maxLen = 150): string {
  const start = content.lastIndexOf("\n", matchPos);
  const lineStart = start === -1 ? 0 : start + 1;
  const end = content.indexOf("\n", matchPos);
  const lineEnd = end === -1 ? content.length : end;
  let snippet = content.substring(lineStart, lineEnd).trim();
  if (snippet.length > maxLen) {
    snippet = snippet.substring(0, maxLen) + "...";
  }
  return snippet;
}

export function runCodeRules(codeFiles: CodeFile[]): Finding[] {
  const findings: Finding[] = [];
  const seenKeys = new Set<string>();

  // Compile regex patterns
  const compiledRules = (RULE_DEFINITIONS as any[]).map((r) => {
    let patternStr: string = r.pattern;
    let flags = "g";
    if (patternStr.includes("(?i)")) {
      patternStr = patternStr.replace(/\(\?i\)/g, "");
      flags += "i";
    }
    try {
      return {
        meta: r,
        regex: new RegExp(patternStr, flags),
      };
    } catch {
      return null;
    }
  }).filter(Boolean) as { meta: any; regex: RegExp }[];

  for (const file of codeFiles) {
    const relPath = file.relative_path;
    const content = file.content;
    if (!content) continue;

    // 1. Regex rules
    for (const { meta, regex } of compiledRules) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        const snippet = extractLineSnippet(content, match.index);
        let matchedVal = match[0].trim();
        if (matchedVal.length > 80) {
          matchedVal = matchedVal.substring(0, 80) + "...";
        }

        let evidence = `${meta.evidence_prefix || "Found match: "}${matchedVal}`;
        if (snippet && snippet !== matchedVal) {
          evidence += ` (Context: \`${snippet}\`)`;
        }

        const dedupKey = `${meta.id}::${relPath}::${snippet}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);

        findings.push({
          id: meta.id,
          severity: meta.severity,
          title: meta.title,
          owasp_category: meta.owasp_category || "M7: Client Code Quality",
          location: relPath,
          evidence,
          remediation: meta.remediation,
        });
      }
    }

    // 2. Compound Rule: INSECURE_WEBVIEW_JS
    const hasJsEnabled = /setJavaScriptEnabled\s*\(\s*true\s*\)/i.test(content);
    const hasJsInterfaceOrFileAccess = /(?:addJavascriptInterface\s*\(|setAllowUniversalAccessFromFileURLs\s*\(\s*true\s*\)|setAllowFileAccessFromFileURLs\s*\(\s*true\s*\))/i.test(content);
    if (hasJsEnabled && hasJsInterfaceOrFileAccess) {
      const dedupKey = `INSECURE_WEBVIEW_JS::${relPath}`;
      if (!seenKeys.has(dedupKey)) {
        seenKeys.add(dedupKey);
        findings.push({
          id: "INSECURE_WEBVIEW_JS",
          severity: "critical",
          title: "Insecure WebView with JavaScript Interface / File Access Enabled",
          owasp_category: "M1: Improper Platform Usage",
          location: relPath,
          evidence: "WebView enables JavaScript (setJavaScriptEnabled(true)) and registers a native bridge or enables universal file URLs, creating potential RCE or cross-origin data exfiltration.",
          remediation: "Avoid exposing Java objects to JavaScript via addJavascriptInterface. If required, target API level 17+ and annotate methods with @JavascriptInterface while disabling file access.\n\nCompliant WebView configuration:\nWebSettings settings = webView.getSettings();\nsettings.setJavaScriptEnabled(true);\nsettings.setAllowFileAccess(false);\nsettings.setAllowContentAccess(false);\nsettings.setAllowFileAccessFromFileURLs(false);\nsettings.setAllowUniversalAccessFromFileURLs(false);\n\nif (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {\n    webView.addJavascriptInterface(new SafeInterface(), \"Bridge\");\n}",
        });
      }
    }

    // 3. Compound Rule: UNENCRYPTED_SQLITE
    const usesSqlite = /\b(?:SQLiteDatabase|SQLiteOpenHelper|openOrCreateDatabase)\b/.test(content);
    const usesSqlcipher = /\b(?:SQLCipher|net\.sqlcipher)\b/i.test(content);
    if (usesSqlite && !usesSqlcipher) {
      const dedupKey = `UNENCRYPTED_SQLITE::${relPath}`;
      if (!seenKeys.has(dedupKey)) {
        seenKeys.add(dedupKey);
        findings.push({
          id: "UNENCRYPTED_SQLITE",
          severity: "medium",
          title: "Unencrypted SQLite Database Usage",
          owasp_category: "M2: Insecure Data Storage",
          location: relPath,
          evidence: `Class uses standard Android SQLite (${relPath}) without database-level encryption (SQLCipher).`,
          remediation: "Encrypt sensitive databases at rest using SQLCipher for Android or Room with SQLCipher driver.\n\nCompliant SQLCipher initialization:\n// build.gradle: implementation 'net.zetetic:android-database-sqlcipher:4.5.4'\nSQLiteDatabase.loadLibs(context);\nFile dbFile = context.getDatabasePath(\"app_secure.db\");\nSQLiteDatabase db = SQLiteDatabase.openOrCreateDatabase(dbFile, masterPassphrase, null);",
        });
      }
    }
  }

  return findings;
}

export function runAllRules(manifest: ManifestData | null, codeFiles: CodeFile[]): Finding[] {
  const manifestFindings = runManifestRules(manifest);
  const codeFindings = runCodeRules(codeFiles);
  return [...manifestFindings, ...codeFindings];
}

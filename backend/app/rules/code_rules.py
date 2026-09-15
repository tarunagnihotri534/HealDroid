import re
import json
from pathlib import Path
from typing import Iterator, Dict, Any, List, Optional

from backend.app.models import Finding

DEFAULT_RULES_PATH = Path(__file__).parent / "rules.json"

def _extract_line_snippet(content: str, match_pos: int, max_len: int = 150) -> str:
    """Extracts line snippet around regex match position."""
    start = content.rfind("\n", 0, match_pos)
    start = 0 if start == -1 else start + 1
    end = content.find("\n", match_pos)
    end = len(content) if end == -1 else end
    snippet = content[start:end].strip()
    if len(snippet) > max_len:
        snippet = snippet[:max_len] + "..."
    return snippet

def run_code_rules(
    code_files_iter: Iterator[Dict[str, Any]], 
    rules_json_path: Optional[Path | str] = None
) -> List[Finding]:
    """
    Executes regex and compound code security rules across decompiled source files.
    """
    rules_path = Path(rules_json_path) if rules_json_path else DEFAULT_RULES_PATH
    
    loaded_rules: List[Dict[str, Any]] = []
    if rules_path.exists():
        with open(rules_path, "r", encoding="utf-8") as f:
            loaded_rules = json.load(f)

    # Compile regex patterns
    compiled_rules = []
    for r in loaded_rules:
        try:
            pattern_str = r.get("pattern", "")
            flags = 0
            if "(?i)" in pattern_str:
                pattern_str = pattern_str.replace("(?i)", "")
                flags = re.IGNORECASE
            compiled_rules.append((r, re.compile(pattern_str, flags)))
        except Exception:
            continue

    findings: List[Finding] = []
    seen_keys = set()

    for file_info in code_files_iter:
        rel_path = file_info.get("relative_path", "")
        content = file_info.get("content", "")
        if not content:
            continue

        # 1. Regex-based code rules
        for rule_meta, compiled_pattern in compiled_rules:
            rule_id = rule_meta["id"]
            
            for match in compiled_pattern.finditer(content):
                snippet = _extract_line_snippet(content, match.start())
                matched_val = match.group(0).strip()
                if len(matched_val) > 80:
                    matched_val = matched_val[:80] + "..."
                    
                evidence = f"{rule_meta.get('evidence_prefix', 'Found match: ')}{matched_val}"
                if snippet and snippet != matched_val:
                    evidence += f" (Context: `{snippet}`)"

                dedup_key = (rule_id, rel_path, snippet)
                if dedup_key in seen_keys:
                    continue
                seen_keys.add(dedup_key)

                findings.append(Finding(
                    id=rule_id,
                    severity=rule_meta["severity"],
                    title=rule_meta["title"],
                    owasp_category=rule_meta.get("owasp_category", "M7: Client Code Quality"),
                    location=rel_path,
                    evidence=evidence,
                    remediation=rule_meta["remediation"]
                ))

        # 2. Compound Rule: INSECURE_WEBVIEW_JS
        # Flag if file contains setJavaScriptEnabled(true) AND (addJavascriptInterface OR insecure file/universal access)
        # Matches both Java source and Smali bytecode invocations
        has_js_enabled = bool(re.search(r"(?:setJavaScriptEnabled\s*\(\s*true\s*\)|->setJavaScriptEnabled\s*\(Z\)V)", content, re.IGNORECASE))
        has_js_interface_or_file_access = bool(re.search(
            r"(?:addJavascriptInterface\s*\(|->addJavascriptInterface|setAllowUniversalAccessFromFileURLs|setAllowFileAccessFromFileURLs)", 
            content, 
            re.IGNORECASE
        ))
        if has_js_enabled and has_js_interface_or_file_access:
            dedup_key = ("INSECURE_WEBVIEW_JS", rel_path)
            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                findings.append(Finding(
                    id="INSECURE_WEBVIEW_JS",
                    severity="critical",
                    title="Insecure WebView with JavaScript Interface / File Access Enabled",
                    owasp_category="M1: Improper Platform Usage",
                    location=rel_path,
                    evidence="WebView enables JavaScript (setJavaScriptEnabled) and registers a native bridge or enables universal file URLs, creating potential RCE or cross-origin data exfiltration.",
                    remediation=(
                        "Avoid exposing Java objects to JavaScript via addJavascriptInterface. If required, target API level 17+ and annotate methods with @JavascriptInterface while disabling file access.\n\n"
                        "Compliant WebView configuration:\n"
                        "WebSettings settings = webView.getSettings();\n"
                        "settings.setJavaScriptEnabled(true);\n"
                        "settings.setAllowFileAccess(false);\n"
                        "settings.setAllowContentAccess(false);\n"
                        "settings.setAllowFileAccessFromFileURLs(false);\n"
                        "settings.setAllowUniversalAccessFromFileURLs(false);\n\n"
                        "if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {\n"
                        "    webView.addJavascriptInterface(new SafeInterface(), \"Bridge\");\n"
                        "}"
                    )
                ))

        # 3. Compound Rule: UNENCRYPTED_SQLITE
        # Flag if file uses SQLite (SQLiteDatabase / SQLiteOpenHelper) without SQLCipher (Java & Smali support)
        uses_sqlite = bool(re.search(r"\b(?:SQLiteDatabase|SQLiteOpenHelper|openOrCreateDatabase|Landroid/database/sqlite/SQLite(?:Database|OpenHelper))\b", content))
        uses_sqlcipher = bool(re.search(r"\b(?:SQLCipher|net\.sqlcipher|net/sqlcipher)\b", content, re.IGNORECASE))
        if uses_sqlite and not uses_sqlcipher:
            dedup_key = ("UNENCRYPTED_SQLITE", rel_path)
            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                findings.append(Finding(
                    id="UNENCRYPTED_SQLITE",
                    severity="medium",
                    title="Unencrypted SQLite Database Usage",
                    owasp_category="M2: Insecure Data Storage",
                    location=rel_path,
                    evidence=f"Component uses standard unencrypted Android SQLite ({rel_path}) without database-level encryption (SQLCipher).",
                    remediation=(
                        "Encrypt sensitive databases at rest using SQLCipher for Android or Room with SQLCipher driver.\n\n"
                        "Compliant SQLCipher initialization:\n"
                        "// build.gradle: implementation 'net.zetetic:android-database-sqlcipher:4.5.4'\n"
                        "SQLiteDatabase.loadLibs(context);\n"
                        "File dbFile = context.getDatabasePath(\"app_secure.db\");\n"
                        "SQLiteDatabase db = SQLiteDatabase.openOrCreateDatabase(dbFile, masterPassphrase, null);"
                    )
                ))

    return findings

from typing import Iterator, Dict, Any, List, Optional
from pathlib import Path

from backend.app.models import ManifestData, Finding
from backend.app.rules.manifest_rules import run_all_manifest_rules
from backend.app.rules.code_rules import run_code_rules

def run_all_rules(
    manifest_data: Optional[ManifestData], 
    code_files_iter: Iterator[Dict[str, Any]],
    rules_json_path: Optional[Path | str] = None
) -> List[Finding]:
    """
    Top-level rule orchestrator.
    Runs all manifest security checks and decompiled code scanning rules.
    Returns combined list of Findings.
    """
    findings: List[Finding] = []
    
    # 1. Manifest-based rules
    manifest_findings = run_all_manifest_rules(manifest_data)
    findings.extend(manifest_findings)
    
    # 2. Code-based rules
    code_findings = run_code_rules(code_files_iter, rules_json_path=rules_json_path)
    findings.extend(code_findings)
    
    return findings

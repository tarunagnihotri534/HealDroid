from typing import List, Dict, Any, Literal
from backend.app.models import Finding, ReportSummary

from collections import defaultdict

SEVERITY_WEIGHTS = {
    "critical": 15,
    "high": 10,
    "medium": 5,
    "low": 2,
    "info": 0
}

MANIFEST_RULE_CAPS = {
    "critical": 25,
    "high": 15,
    "medium": 10,
    "low": 5,
    "info": 0
}

CATEGORY_CAPS = {
    "permissions": 10,       # Max 10 pts deduction for dangerous permissions
    "attack_surface": 25,    # Max 25 pts deduction for exported components (activities, services, receivers, providers)
    "deep_links": 10,        # Max 10 pts deduction for deep link configurations
}

SEVERITY_ORDER = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
    "info": 4
}

def compute_score(findings: List[Finding]) -> int:
    """
    Computes overall security score starting at 100 using an industry-standard
    weighted risk model.
    
    - Code vulnerabilities (secrets, weak crypto, SQLi, etc.) and critical flaws (debuggable, cleartext traffic)
      apply full direct deductions based on severity:
        Critical: 15 pts
        High: 10 pts
        Medium: 5 pts
        Low: 2 pts
    
    - Manifest attack-surface & permission configurations apply diminishing marginal deductions and category caps:
        Permissions: capped at 10 pts max total deduction
        Attack Surface (Exported components): capped at 25 pts max total deduction
        Deep Links: capped at 10 pts max total deduction
    """
    if not findings:
        return 100

    rule_groups = defaultdict(list)
    for f in findings:
        rule_groups[f.id].append(f)

    category_deductions = defaultdict(float)
    total_deduction = 0.0

    for rid, flist in rule_groups.items():
        sev = flist[0].severity.lower()
        base = SEVERITY_WEIGHTS.get(sev, 2)
        count = len(flist)

        # Manifest surface rules apply diminishing returns and category caps
        if rid.startswith("MANIFEST_") and rid not in (
            "MANIFEST_DEBUGGABLE",
            "MANIFEST_CLEARTEXT_TRAFFIC",
            "MANIFEST_EXPORTED_PROVIDER_GRANT_URI"
        ):
            if count == 1:
                rule_ded = float(base)
            elif count == 2:
                rule_ded = base + 0.4 * base
            elif count == 3:
                rule_ded = base + 0.6 * base
            else:
                rule_ded = base + 0.6 * base + (count - 3) * 0.1 * base

            rule_ded = min(rule_ded, float(MANIFEST_RULE_CAPS.get(sev, 15)))

            if "DANGEROUS_PERMISSION" in rid:
                cat = "permissions"
            elif "EXPORTED_" in rid or "UNPROTECTED_BROADCAST" in rid:
                cat = "attack_surface"
            elif "DEEP_LINK" in rid:
                cat = "deep_links"
            else:
                cat = "manifest_general"

            if cat in CATEGORY_CAPS:
                allowed = max(0.0, CATEGORY_CAPS[cat] - category_deductions[cat])
                applied = min(rule_ded, allowed)
                category_deductions[cat] += applied
                total_deduction += applied
            else:
                total_deduction += rule_ded
        else:
            # Code vulnerabilities & critical security flaws: full linear deduction
            total_deduction += base * count

    return max(0, min(100, int(round(100 - total_deduction))))

def score_to_grade(score: int) -> Literal["A", "B", "C", "D", "F"]:
    """
    Maps numeric score [0, 100] to a standard letter grade.
    """
    if score >= 90:
        return "A"
    elif score >= 75:
        return "B"
    elif score >= 60:
        return "C"
    elif score >= 40:
        return "D"
    else:
        return "F"

def compute_summary(findings: List[Finding]) -> ReportSummary:
    """
    Calculates finding counts per severity level.
    """
    summary = ReportSummary()
    for f in findings:
        sev = f.severity.lower()
        if sev == "critical":
            summary.critical += 1
        elif sev == "high":
            summary.high += 1
        elif sev == "medium":
            summary.medium += 1
        elif sev == "low":
            summary.low += 1
        elif sev == "info":
            summary.info += 1
    return summary

def sort_findings(findings: List[Finding]) -> List[Finding]:
    """
    Sorts findings by severity (Critical -> High -> Medium -> Low), then by location.
    """
    return sorted(findings, key=lambda f: (SEVERITY_ORDER.get(f.severity.lower(), 99), f.location, f.title))

def group_findings_by_location(findings: List[Finding]) -> Dict[str, List[Finding]]:
    """
    Groups findings by file/component location for grouped presentation.
    """
    grouped: Dict[str, List[Finding]] = {}
    for f in sort_findings(findings):
        grouped.setdefault(f.location, []).append(f)
    return grouped

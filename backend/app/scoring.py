from typing import List, Dict, Any, Literal
from collections import defaultdict
from backend.app.models import Finding, ReportSummary

# Base severity weights for initial occurrence of a finding
SEVERITY_WEIGHTS: Dict[str, float] = {
    "critical": 15.0,
    "high": 10.0,
    "medium": 5.0,
    "low": 2.0,
    "info": 0.0
}

# Per-rule maximum deduction ceilings for manifest rules
MANIFEST_RULE_CAPS: Dict[str, float] = {
    "critical": 25.0,
    "high": 15.0,
    "medium": 10.0,
    "low": 5.0,
    "info": 0.0
}

# Category deduction ceilings for manifest attack surface domains
CATEGORY_CAPS: Dict[str, float] = {
    "permissions": 10.0,       # Max 10 pts deduction for dangerous permissions
    "attack_surface": 25.0,    # Max 25 pts deduction for exported components (activities, services, receivers, providers, grant_uri)
    "deep_links": 10.0,        # Max 10 pts deduction for deep link configurations
}

SEVERITY_ORDER: Dict[str, int] = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
    "info": 4
}

def compute_score(findings: List[Finding]) -> int:
    """
    Computes overall security score starting at 100 using an industry-standard
    weighted risk model with diminishing marginal returns and category ceilings:

    - Manifest attack-surface, exported components, and permissions apply diminishing
      marginal deductions and domain category caps (e.g. max 25 pts for exported surface).
    - Critical manifest security flags (debuggable, cleartext traffic) and code vulnerabilities
      apply direct deductions with asymptotic scaling for repeated rule occurrences.
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
        base = SEVERITY_WEIGHTS.get(sev, 2.0)
        count = len(flist)

        # Manifest surface rules apply diminishing returns and category caps
        if rid.startswith("MANIFEST_") and rid not in (
            "MANIFEST_DEBUGGABLE",
            "MANIFEST_CLEARTEXT_TRAFFIC",
        ):
            if count == 1:
                rule_ded = float(base)
            elif count == 2:
                rule_ded = base + 0.4 * base
            elif count == 3:
                rule_ded = base + 0.6 * base
            else:
                rule_ded = base + 0.6 * base + (count - 3) * 0.1 * base

            rule_ded = min(rule_ded, float(MANIFEST_RULE_CAPS.get(sev, 15.0)))

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
            # Code vulnerabilities & critical platform security flags:
            # Apply diminishing marginal returns for repeated instances of the same rule
            if count == 1:
                rule_ded = float(base)
            elif count == 2:
                rule_ded = base + 0.4 * base
            elif count == 3:
                rule_ded = base + 0.6 * base
            else:
                rule_ded = base + 0.6 * base + (count - 3) * 0.2 * base

            total_deduction += rule_ded

    return max(0, min(100, int(round(100.0 - total_deduction))))

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

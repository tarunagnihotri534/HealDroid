from typing import List, Dict, Any, Literal
from backend.app.models import Finding, ReportSummary

SEVERITY_WEIGHTS = {
    "critical": 15,
    "high": 10,
    "medium": 5,
    "low": 2
}

SEVERITY_ORDER = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3
}

def compute_score(findings: List[Finding]) -> int:
    """
    Computes overall security score starting at 100 and deducting based on finding severity.
    Clamps minimum score to 0.
    """
    score = 100
    for f in findings:
        score -= SEVERITY_WEIGHTS.get(f.severity.lower(), 0)
    return max(score, 0)

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

from typing import List, Optional
from backend.app.models import Finding, DecompileStats, ManifestData, Report, ReportSummary
from backend.app.scoring import compute_score, score_to_grade, compute_summary, sort_findings

def generate_report(
    app_name: str,
    findings: List[Finding],
    decompilation_stats: Optional[DecompileStats] = None,
    manifest_data: Optional[ManifestData] = None
) -> Report:
    """
    Generates structured security assessment report matching the single source of truth schema.
    """
    resolved_app_name = app_name
    if manifest_data and manifest_data.package_name:
        resolved_app_name = manifest_data.package_name

    score = compute_score(findings)
    grade = score_to_grade(score)
    summary = compute_summary(findings)
    sorted_findings = sort_findings(findings)

    decomp_incomplete = False
    decomp_warnings: List[str] = []

    if decompilation_stats:
        decomp_incomplete = decompilation_stats.decompilation_incomplete or decompilation_stats.status in ("failed", "partial")
        decomp_warnings = list(decompilation_stats.decompilation_warnings)
        if decompilation_stats.error and decompilation_stats.error not in decomp_warnings:
            decomp_warnings.append(decompilation_stats.error)

    return Report(
        app_name=resolved_app_name,
        score=score,
        grade=grade,
        decompilation_incomplete=decomp_incomplete,
        decompilation_warnings=decomp_warnings,
        findings=sorted_findings,
        summary=summary
    )

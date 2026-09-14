from backend.app.models import Finding
from backend.app.scoring import compute_score, score_to_grade, compute_summary, group_findings_by_location

def test_compute_score_deductions():
    # 0 findings = 100
    assert compute_score([]) == 100

    # 1 critical (-15)
    f_crit = [Finding(id="C1", severity="critical", title="T", owasp_category="M1", location="L", evidence="E", remediation="R")]
    assert compute_score(f_crit) == 85

    # 1 critical (-15), 1 high (-10), 1 medium (-5), 1 low (-2) = 100 - 32 = 68
    f_mix = [
        Finding(id="C1", severity="critical", title="T", owasp_category="M1", location="L", evidence="E", remediation="R"),
        Finding(id="H1", severity="high", title="T", owasp_category="M1", location="L", evidence="E", remediation="R"),
        Finding(id="M1", severity="medium", title="T", owasp_category="M1", location="L", evidence="E", remediation="R"),
        Finding(id="L1", severity="low", title="T", owasp_category="M1", location="L", evidence="E", remediation="R"),
    ]
    assert compute_score(f_mix) == 68

    # Clamping at 0
    f_heavy = [Finding(id=f"C{i}", severity="critical", title="T", owasp_category="M1", location="L", evidence="E", remediation="R") for i in range(10)]
    assert compute_score(f_heavy) == 0

def test_score_to_grade():
    assert score_to_grade(95) == "A"
    assert score_to_grade(90) == "A"
    assert score_to_grade(85) == "B"
    assert score_to_grade(75) == "B"
    assert score_to_grade(70) == "C"
    assert score_to_grade(60) == "C"
    assert score_to_grade(50) == "D"
    assert score_to_grade(40) == "D"
    assert score_to_grade(35) == "F"
    assert score_to_grade(0) == "F"

def test_group_findings_by_location():
    findings = [
        Finding(id="1", severity="critical", title="T1", owasp_category="M1", location="com/app/Auth.java", evidence="E", remediation="R"),
        Finding(id="2", severity="high", title="T2", owasp_category="M1", location="com/app/Auth.java", evidence="E", remediation="R"),
        Finding(id="3", severity="medium", title="T3", owasp_category="M1", location="AndroidManifest.xml", evidence="E", remediation="R"),
    ]
    grouped = group_findings_by_location(findings)
    assert len(grouped) == 2
    assert len(grouped["com/app/Auth.java"]) == 2
    assert len(grouped["AndroidManifest.xml"]) == 1

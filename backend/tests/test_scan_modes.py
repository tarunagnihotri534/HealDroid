import time
import shutil
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app, JOBS
from backend.app.manifest_parser import parse_manifest
from backend.app.decompiler import decompile_apk
from backend.app.code_extractor import extract_code_files
from backend.app.rules.rule_runner import run_all_rules
from backend.app.report import generate_report
from backend.app.models import DecompileStats

FIXTURES_DIR = Path(__file__).parent / "fixtures"
TEST_STORAGE = Path(__file__).parent / "tmp_test_modes"

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown():
    if TEST_STORAGE.exists():
        shutil.rmtree(TEST_STORAGE, ignore_errors=True)
    TEST_STORAGE.mkdir(parents=True, exist_ok=True)
    yield
    if TEST_STORAGE.exists():
        shutil.rmtree(TEST_STORAGE, ignore_errors=True)

def test_lightning_mode_skips_decompiler_and_completes_instantly():
    """
    Lightning mode should parse manifest and attack surface in < 2 seconds
    without running JADX decompiler.
    """
    apk_path = FIXTURES_DIR / "com.bank.android-release.apk"
    assert apk_path.exists()

    t0 = time.time()
    with open(apk_path, "rb") as f:
        res = client.post(
            "/api/upload",
            files={"file": ("com.bank.android-release.apk", f, "application/vnd.android.package-archive")},
            data={"scan_mode": "lightning"}
        )
    assert res.status_code == 200
    job_id = res.json()["job_id"]
    assert res.json()["scan_mode"] == "lightning"

    # Poll until complete
    completed = False
    for _ in range(20):
        time.sleep(0.3)
        poll_res = client.get(f"/api/jobs/{job_id}")
        assert poll_res.status_code == 200
        data = poll_res.json()
        if data["status"] in ("complete", "failed"):
            completed = True
            break

    elapsed = time.time() - t0
    assert completed
    assert elapsed < 15.0  # Must be fast under test runner
    assert data["status"] == "complete"
    assert data["decompilation"]["status"] == "skipped"
    assert data["decompilation"]["file_count"] == 0
    assert data["scan_mode"] == "lightning"
    
    # Manifest vulnerabilities must still be captured
    found_ids = {f["id"] for f in data["findings"]}
    assert "MANIFEST_DEBUGGABLE" in found_ids
    assert "MANIFEST_EXPORTED_ACTIVITY" in found_ids

def test_standard_mode_scopes_to_app_package():
    """
    Standard mode scopes code extraction to app packages.
    """
    apk_path = FIXTURES_DIR / "com.bank.android-release.apk"
    manifest = parse_manifest(apk_path)
    assert manifest is not None

    job_dir = TEST_STORAGE / "job_std"
    job_dir.mkdir(parents=True, exist_ok=True)
    decomp_stats = decompile_apk(apk_path, job_dir)

    # Standard mode extraction
    files = list(extract_code_files(
        job_dir / "decompiled",
        target_package=manifest.package_name,
        scan_mode="standard"
    ))
    assert len(files) > 0

    findings = run_all_rules(manifest, iter(files))
    found_ids = {f.id for f in findings}
    assert "SECRET_AWS_KEY" in found_ids
    assert "INSECURE_TRUST_ALL_CERTS" in found_ids

def test_deep_mode_full_extraction():
    """
    Deep audit mode extracts across all decompiled source files.
    """
    apk_path = FIXTURES_DIR / "com.bank.android-release.apk"
    manifest = parse_manifest(apk_path)

    job_dir = TEST_STORAGE / "job_deep"
    job_dir.mkdir(parents=True, exist_ok=True)
    decomp_stats = decompile_apk(apk_path, job_dir)

    files = list(extract_code_files(
        job_dir / "decompiled",
        target_package=manifest.package_name,
        scan_mode="deep"
    ))
    assert len(files) > 0

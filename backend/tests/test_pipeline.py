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

FIXTURES_DIR = Path(__file__).parent / "fixtures"
TEST_STORAGE = Path(__file__).parent / "tmp_test_pipeline"

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown():
    if TEST_STORAGE.exists():
        shutil.rmtree(TEST_STORAGE, ignore_errors=True)
    TEST_STORAGE.mkdir(parents=True, exist_ok=True)
    yield
    if TEST_STORAGE.exists():
        shutil.rmtree(TEST_STORAGE, ignore_errors=True)

def test_full_pipeline_decoy_fixture():
    """
    Tests end-to-end static security analysis on the decoy APK fixture
    with 14+ intentional vulnerabilities.
    """
    apk_path = FIXTURES_DIR / "com.bank.android-release.apk"
    assert apk_path.exists()

    job_dir = TEST_STORAGE / "job_decoy"
    job_dir.mkdir(parents=True, exist_ok=True)

    manifest = parse_manifest(apk_path)
    assert manifest is not None
    assert manifest.package_name == "com.bank.android"

    decomp_stats = decompile_apk(apk_path, job_dir)
    assert decomp_stats.file_count > 0

    code_iter = extract_code_files(job_dir / "decompiled")
    findings = run_all_rules(manifest, code_iter)
    
    report = generate_report("com.bank.android", findings, decomp_stats, manifest)
    
    assert report.score < 60
    assert report.grade in ("D", "F")
    assert report.summary.critical >= 2
    assert report.summary.high >= 4

    found_ids = {f.id for f in report.findings}
    
    # Assert specific required vulnerability classes are accurately flagged
    assert "MANIFEST_DEBUGGABLE" in found_ids
    assert "MANIFEST_CLEARTEXT_TRAFFIC" in found_ids
    assert "MANIFEST_EXPORTED_ACTIVITY" in found_ids
    assert "MANIFEST_EXPORTED_RECEIVER" in found_ids
    assert "MANIFEST_EXPORTED_SERVICE" in found_ids
    assert "MANIFEST_EXPORTED_PROVIDER" in found_ids
    assert "SECRET_AWS_KEY" in found_ids
    assert "SECRET_GENERIC_KEY_TOKEN_PASSWORD" in found_ids
    assert "INSECURE_TRUST_ALL_CERTS" in found_ids
    assert "INSECURE_WEBVIEW_JS" in found_ids
    assert "WORLD_READABLE_WRITABLE_STORAGE" in found_ids
    assert "SQL_INJECTION" in found_ids
    assert "WEAK_CRYPTO_MD5" in found_ids
    assert "WEAK_CRYPTO_SHA1" in found_ids

def test_full_pipeline_insecurebank_fixture():
    """
    Tests end-to-end static security analysis on the InsecureBankv2 compiled APK fixture.
    """
    apk_path = FIXTURES_DIR / "InsecureBankv2.apk"
    assert apk_path.exists()

    job_dir = TEST_STORAGE / "job_insecurebank"
    job_dir.mkdir(parents=True, exist_ok=True)

    manifest = parse_manifest(apk_path)
    assert manifest.package_name == "com.android.insecurebankv2"

    decomp_stats = decompile_apk(apk_path, job_dir)
    assert decomp_stats.file_count > 0

    code_iter = extract_code_files(job_dir / "decompiled")
    findings = run_all_rules(manifest, code_iter)

    report = generate_report(apk_path.stem, findings, decomp_stats, manifest)

    found_ids = {f.id for f in report.findings}
    assert "MANIFEST_DEBUGGABLE" in found_ids
    assert "MANIFEST_EXPORTED_ACTIVITY" in found_ids
    assert "MANIFEST_EXPORTED_RECEIVER" in found_ids
    assert "MANIFEST_EXPORTED_PROVIDER" in found_ids
    assert "MANIFEST_CLEARTEXT_TRAFFIC" in found_ids
    assert "MANIFEST_DANGEROUS_PERMISSION" in found_ids
    assert "INSECURE_WEBVIEW_JS" in found_ids
    assert "UNENCRYPTED_SQLITE" in found_ids
    assert "WEAK_CRYPTO_MD5" in found_ids
    assert "WEAK_CRYPTO_SHA1" in found_ids
    assert "CLEARTEXT_HTTP" in found_ids

def test_async_upload_and_job_status_api():
    """
    Tests the FastAPI asynchronous upload endpoint and job status polling.
    """
    apk_path = FIXTURES_DIR / "com.bank.android-release.apk"
    with open(apk_path, "rb") as f:
        resp = client.post("/api/upload", files={"file": ("com.bank.android-release.apk", f, "application/vnd.android.package-archive")})
    
    assert resp.status_code == 200
    data = resp.json()
    job_id = data["job_id"]
    assert job_id is not None
    assert data["status"] in ("processing", "complete")

    # Poll status endpoint
    poll_count = 0
    while poll_count < 20:
        get_resp = client.get(f"/api/jobs/{job_id}")
        assert get_resp.status_code == 200
        job_data = get_resp.json()
        if job_data["status"] in ("complete", "partial"):
            assert len(job_data["findings"]) > 0
            assert "score" in job_data
            assert "grade" in job_data
            assert "summary" in job_data
            break
        time.sleep(0.5)
        poll_count += 1

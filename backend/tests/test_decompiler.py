import shutil
import pytest
from pathlib import Path

from backend.app.decompiler import decompile_apk, find_jadx_binary
from backend.app.code_extractor import CodeExtractor

FIXTURES_DIR = Path(__file__).parent / "fixtures"
TEST_STORAGE = Path(__file__).parent / "tmp_test_storage"

@pytest.fixture(autouse=True)
def cleanup():
    if TEST_STORAGE.exists():
        shutil.rmtree(TEST_STORAGE, ignore_errors=True)
    TEST_STORAGE.mkdir(parents=True, exist_ok=True)
    yield
    if TEST_STORAGE.exists():
        shutil.rmtree(TEST_STORAGE, ignore_errors=True)

def test_jadx_binary_exists():
    jadx_path = find_jadx_binary()
    assert jadx_path is not None, "jadx binary could not be found! Run setup_jadx.ps1 or setup_jadx.sh"
    assert Path(jadx_path).exists()

def test_decompile_compiled_apk_with_jadx():
    """
    Asserts that real compiled APK (InsecureBankv2) triggers the genuine jadx subprocess
    and produces readable Java source files.
    """
    apk_path = FIXTURES_DIR / "InsecureBankv2.apk"
    assert apk_path.exists(), f"Fixture {apk_path} missing"

    job_dir = TEST_STORAGE / "job_jadx"
    job_dir.mkdir(parents=True, exist_ok=True)

    stats = decompile_apk(apk_path, job_dir)

    assert stats.status == "complete", f"Decompilation failed: {stats.error}"
    assert stats.method == "jadx", f"Expected method 'jadx' but got '{stats.method}'"
    assert stats.file_count > 0, "No Java files were decompiled"

    # Verify code extractor iterates over decompiled files
    decompiled_dir = job_dir / "decompiled"
    extractor = CodeExtractor(decompiled_dir)
    assert extractor.count_files() == stats.file_count

    found_expected_class = False
    files_checked = 0

    for file_info in extractor.iter_files():
        files_checked += 1
        assert "file_path" in file_info
        assert "relative_path" in file_info
        assert "content" in file_info
        assert isinstance(file_info["content"], str)

        if "DoLogin.java" in file_info["relative_path"] or "LoginActivity.java" in file_info["relative_path"]:
            found_expected_class = True
            assert "class " in file_info["content"]

    assert files_checked > 0
    assert found_expected_class, "Expected DoLogin or LoginActivity class was not found in decompiled output"

def test_decompile_raw_source_fixture_fallback():
    """
    Asserts that the raw-source fixture (com.bank.android-release.apk)
    is cleanly extracted and yields its Java classes.
    """
    apk_path = FIXTURES_DIR / "com.bank.android-release.apk"
    assert apk_path.exists(), f"Fixture {apk_path} missing"

    job_dir = TEST_STORAGE / "job_mock"
    job_dir.mkdir(parents=True, exist_ok=True)

    stats = decompile_apk(apk_path, job_dir)

    assert stats.status == "complete", f"Decompilation failed: {stats.error}"
    assert stats.file_count >= 5

    decompiled_dir = job_dir / "decompiled"
    extractor = CodeExtractor(decompiled_dir)

    class_names = [f["relative_path"] for f in extractor.iter_files()]
    assert any("CryptoHelper.java" in name for name in class_names)
    assert any("LoginActivity.java" in name for name in class_names)

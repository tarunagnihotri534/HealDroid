import pytest
from pathlib import Path
from backend.app.manifest_parser import parse_manifest

FIXTURES_DIR = Path(__file__).parent / "fixtures"

def test_manifest_compiled_insecurebank():
    apk_path = FIXTURES_DIR / "InsecureBankv2.apk"
    assert apk_path.exists(), f"Missing fixture {apk_path}"

    manifest = parse_manifest(apk_path)
    assert manifest is not None
    assert manifest.package_name == "com.android.insecurebankv2"
    assert len(manifest.permissions) >= 5
    assert "android.permission.INTERNET" in manifest.permissions
    
    # Assert components extracted
    assert len(manifest.components) > 0
    activity_names = [c.name for c in manifest.components if c.type == "activity"]
    assert any("LoginActivity" in name for name in activity_names)

def test_manifest_plain_xml_fixture():
    apk_path = FIXTURES_DIR / "com.bank.android-release.apk"
    assert apk_path.exists(), f"Missing fixture {apk_path}"

    manifest = parse_manifest(apk_path)
    assert manifest is not None
    assert manifest.package_name == "com.bank.android"
    assert manifest.debuggable is True
    assert manifest.uses_cleartext_traffic is True
    assert len(manifest.permissions) >= 5
    assert len(manifest.components) >= 4

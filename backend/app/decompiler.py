import os
import sys
import time
import shutil
import zipfile
import subprocess
from pathlib import Path
from typing import Optional

from backend.app.schemas import DecompileStats

TIMEOUT_SECONDS = 90

def find_jadx_binary() -> Optional[str]:
    """
    Finds jadx binary from bundled tools/jadx or system PATH.
    """
    # 1. Check bundled tools/jadx/bin relative to project root
    project_root = Path(__file__).resolve().parent.parent.parent
    bundled_dir = project_root / "tools" / "jadx" / "bin"
    
    if sys.platform.startswith("win"):
        bundled_exe = bundled_dir / "jadx.bat"
    else:
        bundled_exe = bundled_dir / "jadx"
        
    if bundled_exe.is_file():
        return str(bundled_exe)
        
    # 2. Check system PATH
    system_jadx = shutil.which("jadx")
    if system_jadx:
        return system_jadx
        
    return None

def count_java_files(directory: Path) -> int:
    """Counts total .java files in directory tree."""
    if not directory.exists():
        return 0
    return sum(1 for _ in directory.rglob("*.java"))

def _extract_raw_java_source(apk_path: Path, output_dir: Path) -> int:
    """
    Fallback: extracts .java files if the APK archive is a source bundle.
    """
    count = 0
    sources_dir = output_dir / "sources"
    with zipfile.ZipFile(apk_path, "r") as z:
        for name in z.namelist():
            if name.endswith(".java"):
                # Avoid zip-slip
                p = Path(name)
                dest = sources_dir / p
                dest.parent.mkdir(parents=True, exist_ok=True)
                with z.open(name) as src, open(dest, "wb") as dst:
                    dst.write(src.read())
                count += 1
    return count

def decompile_apk(apk_path: Path, job_dir: Path, timeout: int = TIMEOUT_SECONDS) -> DecompileStats:
    """
    Decompiles an APK using jadx into job_dir/decompiled.
    Handles timeout, failures, and fallback for source-bundle APKs.
    """
    decompiled_dir = job_dir / "decompiled"
    decompiled_dir.mkdir(parents=True, exist_ok=True)
    
    start_time = time.time()
    jadx_bin = find_jadx_binary()
    
    if not jadx_bin:
        # If jadx is missing, try raw source fallback before failing
        extracted = _extract_raw_java_source(apk_path, decompiled_dir)
        elapsed = round(time.time() - start_time, 2)
        if extracted > 0:
            return DecompileStats(
                status="complete",
                method="raw_source",
                file_count=extracted,
                time_taken_seconds=elapsed,
            )
        return DecompileStats(
            status="failed",
            method="none",
            file_count=0,
            time_taken_seconds=elapsed,
            error="jadx binary not found. Please run setup_jadx.ps1 or setup_jadx.sh."
        )

    # Invoke jadx CLI
    cmd = [
        jadx_bin,
        "-d", str(decompiled_dir),
        "--no-res",  # skip resources to speed up code extraction
        str(apk_path)
    ]
    
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout
        )
        elapsed = round(time.time() - start_time, 2)
        file_count = count_java_files(decompiled_dir)
        
        if file_count > 0:
            return DecompileStats(
                status="complete",
                method="jadx",
                file_count=file_count,
                time_taken_seconds=elapsed,
            )
            
        # If jadx exited with 0 files, check if APK has raw .java files (e.g. test fixture archive)
        extracted = _extract_raw_java_source(apk_path, decompiled_dir)
        if extracted > 0:
            return DecompileStats(
                status="complete",
                method="raw_source",
                file_count=extracted,
                time_taken_seconds=elapsed,
            )
            
        err_msg = proc.stderr.strip() or proc.stdout.strip() or "jadx produced no Java files."
        return DecompileStats(
            status="failed",
            method="jadx",
            file_count=0,
            time_taken_seconds=elapsed,
            error=err_msg[:500]
        )
        
    except subprocess.TimeoutExpired:
        elapsed = round(time.time() - start_time, 2)
        return DecompileStats(
            status="failed",
            method="jadx",
            file_count=0,
            time_taken_seconds=elapsed,
            error=f"Decompilation timed out after {timeout} seconds."
        )
    except Exception as e:
        elapsed = round(time.time() - start_time, 2)
        return DecompileStats(
            status="failed",
            method="jadx",
            file_count=0,
            time_taken_seconds=elapsed,
            error=str(e)
        )

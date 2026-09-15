import os
import sys
import time
import shutil
import zipfile
import subprocess
from pathlib import Path
from typing import Optional, List

from backend.app.models import DecompileStats

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
    """Counts total .java files in directory tree quickly using os.walk."""
    if not directory.exists():
        return 0
    count = 0
    for _, _, files in os.walk(str(directory)):
        for f in files:
            if f.endswith(".java") or f.endswith(".smali"):
                count += 1
    return count

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
    Handles timeout, failures, partial decompilations, and fallback for source-bundle APKs.
    Surfaces decompilation_incomplete and decompilation_warnings in DecompileStats.
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
                decompilation_incomplete=False,
                decompilation_warnings=[]
            )
        return DecompileStats(
            status="failed",
            method="none",
            file_count=0,
            time_taken_seconds=elapsed,
            error="jadx binary not found. Please run setup_jadx.ps1 or setup_jadx.sh.",
            decompilation_incomplete=True,
            decompilation_warnings=["jadx binary not found on system PATH or in tools/jadx"]
        )

    # Invoke jadx CLI with memory-capped and I/O-optimized flags
    cmd = [
        jadx_bin,
        "-j", "2",          # Limit to 2 threads to prevent NVMe/SSD saturation and 100% active disk queue
        "-d", str(decompiled_dir),
        "--no-res",         # Skip resources to speed up code extraction
        "--no-debug-info",  # Skip debug line/var tables, reducing memory and disk writes by ~40%
        str(apk_path)
    ]
    
    # Restrict JVM Heap to 768 MB so it never hogs host system memory
    sub_env = os.environ.copy()
    sub_env["JAVA_OPTS"] = "-Xmx768m -Xms128m -XX:+UseG1GC"
    sub_env["DEFAULT_JVM_OPTS"] = "-Xmx768m -Xms128m -XX:+UseG1GC"

    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout,
            env=sub_env
        )
        elapsed = round(time.time() - start_time, 2)
        file_count = count_java_files(decompiled_dir)
        
        warnings: List[str] = []
        stderr_text = proc.stderr or ""
        stdout_text = proc.stdout or ""
        combined_output = f"{stdout_text}\n{stderr_text}"
        
        # Check for errors/warnings in output
        for line in combined_output.splitlines():
            line_str = line.strip()
            if "ERROR" in line_str or "WARN" in line_str:
                if len(line_str) > 200:
                    line_str = line_str[:200] + "..."
                if line_str not in warnings:
                    warnings.append(line_str)
                    if len(warnings) >= 10:  # limit noise
                        break

        incomplete = False
        if proc.returncode != 0:
            incomplete = True
            warnings.append(f"jadx process exited with non-zero code {proc.returncode}")

        if file_count > 0:
            return DecompileStats(
                status="complete",
                method="jadx",
                file_count=file_count,
                time_taken_seconds=elapsed,
                decompilation_incomplete=incomplete or len(warnings) > 0,
                decompilation_warnings=warnings
            )
            
        # If jadx exited with 0 files, check if APK has raw .java files (e.g. test fixture archive)
        extracted = _extract_raw_java_source(apk_path, decompiled_dir)
        if extracted > 0:
            return DecompileStats(
                status="complete",
                method="raw_source",
                file_count=extracted,
                time_taken_seconds=elapsed,
                decompilation_incomplete=False,
                decompilation_warnings=[]
            )
            
        err_msg = proc.stderr.strip() or proc.stdout.strip() or "jadx produced no Java files."
        return DecompileStats(
            status="failed",
            method="jadx",
            file_count=0,
            time_taken_seconds=elapsed,
            error=err_msg[:500],
            decompilation_incomplete=True,
            decompilation_warnings=[err_msg[:300]]
        )
        
    except subprocess.TimeoutExpired:
        elapsed = round(time.time() - start_time, 2)
        file_count = count_java_files(decompiled_dir)
        return DecompileStats(
            status="failed" if file_count == 0 else "complete",
            method="jadx",
            file_count=file_count,
            time_taken_seconds=elapsed,
            error=f"Decompilation timed out after {timeout} seconds.",
            decompilation_incomplete=True,
            decompilation_warnings=[f"Decompilation timed out after {timeout} seconds; partial files may have been recovered."]
        )
    except Exception as e:
        elapsed = round(time.time() - start_time, 2)
        return DecompileStats(
            status="failed",
            method="jadx",
            file_count=0,
            time_taken_seconds=elapsed,
            error=str(e),
            decompilation_incomplete=True,
            decompilation_warnings=[str(e)]
        )

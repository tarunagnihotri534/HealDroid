import os
import uuid
import shutil
import zipfile
from pathlib import Path
from fastapi import HTTPException, UploadFile

STORAGE_DIR = Path("storage") / "jobs"

def cleanup_old_jobs(max_retained: int = 3):
    """
    Prunes older job directories to keep disk space lean and avoid file watcher bloat.
    """
    if not STORAGE_DIR.exists():
        return
    try:
        job_dirs = [d for d in STORAGE_DIR.iterdir() if d.is_dir()]
        if len(job_dirs) > max_retained:
            job_dirs.sort(key=lambda d: d.stat().st_mtime, reverse=True)
            for old_dir in job_dirs[max_retained:]:
                shutil.rmtree(old_dir, ignore_errors=True)
    except Exception:
        pass

MAX_UPLOAD_SIZE = 150 * 1024 * 1024  # 150 MB

def create_job(upload_file: UploadFile) -> tuple[str, Path, Path]:
    """
    Accepts an uploaded file, enforces a strict file size ceiling,
    verifies it is a valid zip/apk, saves it to storage/jobs/{job_id}/app.apk,
    and returns (job_id, apk_path, job_dir).
    """
    cleanup_old_jobs(max_retained=3)
    # Cryptographically secure 128-bit identifier (32 hex characters) to prevent IDOR enumeration
    job_id = uuid.uuid4().hex
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    apk_path = job_dir / "app.apk"
    total_bytes = 0
    chunk_size = 1024 * 1024  # 1 MB chunk

    try:
        with open(apk_path, "wb") as f:
            while True:
                chunk = upload_file.file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="APK archive exceeds maximum allowed size (150 MB)."
                    )
                f.write(chunk)
    except HTTPException:
        if apk_path.exists():
            apk_path.unlink()
        shutil.rmtree(job_dir, ignore_errors=True)
        raise
        
    # Validation: must be a valid zip archive
    if not zipfile.is_zipfile(apk_path):
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid APK or zip archive."
        )
        
    # Check for AndroidManifest.xml inside
    with zipfile.ZipFile(apk_path, "r") as z:
        names = z.namelist()
        has_manifest = any(name.endswith("AndroidManifest.xml") for name in names)
        if not has_manifest:
            shutil.rmtree(job_dir, ignore_errors=True)
            raise HTTPException(
                status_code=400,
                detail="APK archive missing AndroidManifest.xml"
            )

    return job_id, apk_path, job_dir

def save_apk_bytes(content: bytes, filename: str = "app.apk") -> tuple[str, Path, Path]:
    if len(content) > MAX_UPLOAD_SIZE:
        raise ValueError("Payload exceeds maximum size limit (150 MB).")

    job_id = uuid.uuid4().hex
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    apk_path = job_dir / filename
    with open(apk_path, "wb") as f:
        f.write(content)
        
    if not zipfile.is_zipfile(apk_path):
        raise ValueError("Provided bytes do not form a valid zip/APK archive.")
        
    with zipfile.ZipFile(apk_path, "r") as z:
        names = z.namelist()
        if not any(name.endswith("AndroidManifest.xml") for name in names):
            raise ValueError("Archive missing AndroidManifest.xml")
            
    return job_id, apk_path, job_dir

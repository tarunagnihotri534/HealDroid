import os
import uuid
import zipfile
from pathlib import Path
from fastapi import HTTPException, UploadFile

STORAGE_DIR = Path("storage") / "jobs"

def create_job(upload_file: UploadFile) -> tuple[str, Path, Path]:
    """
    Accepts an uploaded file, verifies it is a valid zip/apk,
    saves it to storage/jobs/{job_id}/app.apk, and returns (job_id, apk_path, job_dir).
    """
    job_id = str(uuid.uuid4())[:8]
    job_dir = STORAGE_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    
    apk_path = job_dir / "app.apk"
    with open(apk_path, "wb") as f:
        content = upload_file.file.read()
        f.write(content)
        
    # Validation: must be a valid zip archive
    if not zipfile.is_zipfile(apk_path):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not a valid APK or zip archive."
        )
        
    # Check for AndroidManifest.xml inside
    with zipfile.ZipFile(apk_path, "r") as z:
        names = z.namelist()
        has_manifest = any(name.endswith("AndroidManifest.xml") for name in names)
        if not has_manifest:
            raise HTTPException(
                status_code=400,
                detail="APK archive missing AndroidManifest.xml"
            )

    return job_id, apk_path, job_dir

def save_apk_bytes(content: bytes, filename: str = "app.apk") -> tuple[str, Path, Path]:
    job_id = str(uuid.uuid4())[:8]
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

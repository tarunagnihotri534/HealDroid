import os
import sys
from pathlib import Path
from typing import Dict
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# Reduce noisy third-party debug logging
logger.remove()
logger.add(sys.stderr, level="WARNING")

from backend.app.schemas import JobResponse, ManifestData, DecompileStats
from backend.app.ingestion import create_job
from backend.app.manifest_parser import parse_manifest
from backend.app.decompiler import decompile_apk, find_jadx_binary

app = FastAPI(
    title="APK Security Analysis Engine",
    description="Static analysis engine for Android APKs with manifest parsing and jadx decompilation.",
    version="0.2.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job state (resets on server restart — acceptable for hackathon scope)
JOBS: Dict[str, JobResponse] = {}

@app.get("/api/health")
def health_check():
    jadx_bin = find_jadx_binary()
    return {
        "status": "ok",
        "jadx_available": jadx_bin is not None,
        "jadx_path": jadx_bin
    }

@app.post("/api/upload", response_model=JobResponse)
def upload_apk(file: UploadFile = File(...)):
    """
    Ingest, parse manifest, and decompile APK synchronously.
    """
    if not file.filename.lower().endswith(".apk"):
        raise HTTPException(status_code=400, detail="Only .apk files are supported.")
        
    try:
        job_id, apk_path, job_dir = create_job(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to ingest APK: {str(e)}")

    file_size = apk_path.stat().st_size

    # 1. Manifest extraction
    try:
        manifest_data = parse_manifest(apk_path)
    except Exception as e:
        manifest_data = None

    # 2. Decompilation
    try:
        decomp_stats = decompile_apk(apk_path, job_dir)
    except Exception as e:
        decomp_stats = DecompileStats(
            status="failed",
            method="none",
            file_count=0,
            error=str(e)
        )

    app_name = (
        (manifest_data.package_name if manifest_data and manifest_data.package_name else "")
        or Path(file.filename).stem
    )

    response = JobResponse(
        job_id=job_id,
        app_name=app_name,
        file_size_bytes=file_size,
        status="complete" if (decomp_stats and decomp_stats.status == "complete") else "partial",
        manifest=manifest_data,
        decompilation=decomp_stats
    )

    JOBS[job_id] = response
    return response

@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JOBS[job_id]

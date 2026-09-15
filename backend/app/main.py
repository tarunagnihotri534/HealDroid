import os
import sys
from pathlib import Path
from typing import Dict, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# Reduce noisy third-party debug logging
logger.remove()
logger.add(sys.stderr, level="WARNING")

from backend.app.models import JobResponse, ManifestData, DecompileStats, Finding, ReportSummary, Report
from backend.app.ingestion import create_job
from backend.app.manifest_parser import parse_manifest
from backend.app.decompiler import decompile_apk, find_jadx_binary
from backend.app.code_extractor import extract_code_files
from backend.app.rules.rule_runner import run_all_rules
from backend.app.report import generate_report

app = FastAPI(
    title="HealDroid - APK Security Analysis Engine",
    description="Static analysis engine for Android APKs with manifest parsing, jadx decompilation, and rule-based vulnerability scanning.",
    version="0.3.0"
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

def process_apk_job(job_id: str, apk_path: Path, job_dir: Path, original_filename: str, scan_mode: str = "standard"):
    """
    Background worker executing the analysis pipeline based on scan_mode:
    - lightning: Manifest parser -> surface rules -> report (JADX skipped, ~1-3s)
    - standard: Manifest parser -> JADX -> app-scoped rules -> report (~8-12s)
    - deep: Manifest parser -> JADX -> full multi-class AST/regex audit -> report (~35-50s)
    """
    try:
        # 1. Manifest extraction
        if job_id in JOBS:
            JOBS[job_id].current_stage = "manifest"
            JOBS[job_id].stage_message = "Parsing AndroidManifest.xml and component declarations..."

        try:
            manifest_data = parse_manifest(apk_path)
        except Exception as e:
            logger.warning(f"Manifest extraction failed for job {job_id}: {e}")
            manifest_data = None

        # 2. Decompilation (Skipped in Lightning mode)
        if scan_mode == "lightning":
            if job_id in JOBS:
                JOBS[job_id].manifest = manifest_data
                JOBS[job_id].current_stage = "rules"
                JOBS[job_id].stage_message = "Lightning mode: Skipping decompiler, evaluating surface & manifest rules..."

            decomp_stats = DecompileStats(
                status="skipped",
                method="none",
                file_count=0,
                time_taken_seconds=0.0,
                decompilation_incomplete=False,
                decompilation_warnings=["Decompilation bypassed for fast Lightning Triage mode."]
            )
            findings = run_all_rules(manifest_data, iter([]))
        else:
            if job_id in JOBS:
                JOBS[job_id].current_stage = "decompiling"
                JOBS[job_id].manifest = manifest_data
                mode_label = "App-scoped" if scan_mode == "standard" else "Full deep"
                JOBS[job_id].stage_message = f"Decompiling Dalvik bytecode into Java source AST ({mode_label})..."

            try:
                decomp_stats = decompile_apk(apk_path, job_dir, scan_mode=scan_mode)
            except Exception as e:
                logger.error(f"Decompilation failed for job {job_id}: {e}")
                decomp_stats = DecompileStats(
                    status="failed",
                    method="none",
                    file_count=0,
                    error=str(e),
                    decompilation_incomplete=True,
                    decompilation_warnings=[f"Decompilation exception: {str(e)}"]
                )

            # 3. Rule execution across manifest and decompiled source files
            if job_id in JOBS:
                JOBS[job_id].current_stage = "rules"
                JOBS[job_id].decompilation = decomp_stats
                fc = decomp_stats.file_count
                JOBS[job_id].stage_message = f"Evaluating security rules across {fc:,} extracted source files ({scan_mode} profile)..."

            decompiled_dir = job_dir / "decompiled"
            target_pkg = manifest_data.package_name if manifest_data else None
            code_files_iter = extract_code_files(decompiled_dir, target_package=target_pkg, scan_mode=scan_mode)
            findings = run_all_rules(manifest_data, code_files_iter)

        # 4. Report generation & scoring
        if job_id in JOBS:
            JOBS[job_id].current_stage = "scoring"
            JOBS[job_id].stage_message = "Calculating weighted OWASP risk score and remediation guidance..."

        fallback_name = Path(original_filename).stem
        report = generate_report(
            app_name=fallback_name,
            findings=findings,
            decompilation_stats=decomp_stats,
            manifest_data=manifest_data
        )

        file_size = apk_path.stat().st_size if apk_path.exists() else 0

        # Update job response
        status = "complete" if decomp_stats.status != "failed" else "partial"
        JOBS[job_id] = JobResponse(
            job_id=job_id,
            app_name=report.app_name,
            file_size_bytes=file_size,
            status=status,
            score=report.score,
            grade=report.grade,
            decompilation_incomplete=report.decompilation_incomplete,
            decompilation_warnings=report.decompilation_warnings,
            findings=report.findings,
            summary=report.summary,
            manifest=manifest_data,
            decompilation=decomp_stats,
            current_stage="complete",
            stage_message="Analysis completed successfully",
            scan_mode=scan_mode
        )
    except Exception as e:
        logger.exception(f"Unexpected error processing job {job_id}: {e}")
        if job_id in JOBS:
            JOBS[job_id].status = "failed"
            JOBS[job_id].error = str(e)
            JOBS[job_id].decompilation_incomplete = True
            JOBS[job_id].decompilation_warnings.append(f"Fatal processing error: {str(e)}")

@app.get("/api/health")
def health_check():
    jadx_bin = find_jadx_binary()
    return {
        "status": "ok",
        "jadx_available": jadx_bin is not None,
        "jadx_path": jadx_bin
    }

@app.post("/api/upload", response_model=JobResponse)
def upload_apk(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    scan_mode: str = Form("standard")
):
    """
    Asynchronously ingest and analyze an APK file using BackgroundTasks.
    Supports scan_mode: 'lightning' | 'standard' | 'deep'.
    Immediately returns job_id and status="processing".
    """
    if not file.filename.lower().endswith(".apk"):
        raise HTTPException(status_code=400, detail="Only .apk files are supported.")
        
    mode = scan_mode.lower().strip()
    if mode not in ("lightning", "standard", "deep"):
        mode = "standard"

    try:
        job_id, apk_path, job_dir = create_job(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to ingest APK: {str(e)}")

    file_size = apk_path.stat().st_size if apk_path.exists() else 0
    app_name = Path(file.filename).stem

    initial_job = JobResponse(
        job_id=job_id,
        app_name=app_name,
        file_size_bytes=file_size,
        status="processing",
        score=100,
        grade="A",
        decompilation_incomplete=False,
        decompilation_warnings=[],
        findings=[],
        summary=ReportSummary(),
        manifest=None,
        decompilation=DecompileStats(status="pending"),
        current_stage="manifest",
        stage_message=f"Starting {mode} security scan...",
        scan_mode=mode
    )
    JOBS[job_id] = initial_job

    # Launch processing pipeline asynchronously in background with scan profile
    background_tasks.add_task(process_apk_job, job_id, apk_path, job_dir, file.filename, mode)

    return initial_job

@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    """
    Returns current status and complete security report once processing finishes.
    """
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JOBS[job_id]

@app.get("/api/jobs/{job_id}/report", response_model=Report)
def get_job_report(job_id: str):
    """
    Returns exact Report object schema for job.
    """
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
    job = JOBS[job_id]
    return Report(
        app_name=job.app_name,
        score=job.score,
        grade=job.grade,
        decompilation_incomplete=job.decompilation_incomplete,
        decompilation_warnings=job.decompilation_warnings,
        findings=job.findings,
        summary=job.summary
    )

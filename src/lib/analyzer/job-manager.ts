import fs from "fs";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";
import { JobResponse, Report, ManifestData, DecompileStats } from "./types";
import { parseManifestBuffer } from "./manifest-parser";
import { decompileAndExtractCode } from "./decompiler";
import { runAllRules } from "./rules-engine";
import { generateReport } from "./report";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "jobs");

// In-memory job repository (global across hot-reloads)
declare global {
  // eslint-disable-next-line no-var
  var __HEALDROID_JOBS__: Map<string, JobResponse> | undefined;
}

const JOBS = global.__HEALDROID_JOBS__ || new Map<string, JobResponse>();
global.__HEALDROID_JOBS__ = JOBS;

export function getJob(jobId: string): JobResponse | null {
  return JOBS.get(jobId) || null;
}

export function getJobReport(jobId: string): Report | null {
  const job = JOBS.get(jobId);
  if (!job) return null;
  return {
    app_name: job.app_name,
    score: job.score,
    grade: job.grade,
    decompilation_incomplete: job.decompilation_incomplete,
    decompilation_warnings: job.decompilation_warnings,
    findings: job.findings,
    summary: job.summary,
  };
}

export function listJobs(): JobResponse[] {
  return Array.from(JOBS.values());
}

export async function processApkBuffer(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<JobResponse> {
  const jobId = crypto.randomBytes(4).toString("hex");
  const jobDir = path.join(STORAGE_ROOT, jobId);
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }

  const apkPath = path.join(jobDir, "app.apk");
  fs.writeFileSync(apkPath, fileBuffer);

  const rawAppName = path.parse(originalFilename).name;
  const fileSize = fileBuffer.length;

  // Initialize job in processing state
  const initialJob: JobResponse = {
    job_id: jobId,
    app_name: rawAppName,
    file_size_bytes: fileSize,
    status: "processing",
    score: 100,
    grade: "A",
    decompilation_incomplete: false,
    decompilation_warnings: [],
    findings: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0 },
    manifest: null,
    decompilation: {
      status: "decompiling",
      method: "none",
      file_count: 0,
      time_taken_seconds: 0,
      decompilation_incomplete: false,
      decompilation_warnings: [],
    },
  };
  JOBS.set(jobId, initialJob);

  try {
    // 1. Verify Zip Archive
    let zip: AdmZip;
    try {
      zip = new AdmZip(apkPath);
    } catch {
      throw new Error("Uploaded file is not a valid APK or zip archive.");
    }

    // 2. Extract Manifest
    let manifestData: ManifestData | null = null;
    const manifestEntry = zip.getEntries().find((e) =>
      e.entryName.endsWith("AndroidManifest.xml")
    );

    if (manifestEntry) {
      try {
        const manifestBuf = manifestEntry.getData();
        manifestData = parseManifestBuffer(manifestBuf);
      } catch (e: any) {
        console.warn(`Manifest parsing failed for job ${jobId}:`, e);
      }
    } else {
      throw new Error("APK archive missing AndroidManifest.xml");
    }

    // 3. Decompile & Extract Code
    const { stats: decompStats, codeFiles } = await decompileAndExtractCode(
      apkPath,
      jobDir,
      zip
    );

    // 4. Run Security Rules
    const findings = runAllRules(manifestData, codeFiles);

    // 5. Generate Report & Compute Final Score
    const report = generateReport(
      rawAppName,
      findings,
      decompStats,
      manifestData
    );

    const finalStatus =
      decompStats.status === "failed" ? "partial" : "complete";

    const completedJob: JobResponse = {
      job_id: jobId,
      app_name: report.app_name,
      file_size_bytes: fileSize,
      status: finalStatus,
      score: report.score,
      grade: report.grade,
      decompilation_incomplete: report.decompilation_incomplete,
      decompilation_warnings: report.decompilation_warnings,
      findings: report.findings,
      summary: report.summary,
      manifest: manifestData,
      decompilation: decompStats,
    };

    JOBS.set(jobId, completedJob);
    return completedJob;
  } catch (err: any) {
    console.error(`Failed to process APK for job ${jobId}:`, err);
    const failedJob: JobResponse = {
      job_id: jobId,
      app_name: rawAppName,
      file_size_bytes: fileSize,
      status: "failed",
      score: 0,
      grade: "F",
      decompilation_incomplete: true,
      decompilation_warnings: [String(err?.message || err)],
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0 },
      error: String(err?.message || err),
    };
    JOBS.set(jobId, failedJob);
    return failedJob;
  }
}

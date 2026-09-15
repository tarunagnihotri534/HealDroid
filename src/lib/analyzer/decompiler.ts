import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import AdmZip from "adm-zip";
import { DecompileStats } from "./types";
import { CodeFile } from "./rules-engine";
import { extractDexStrings } from "./dex-extractor";

export function findJadxBinary(): string | null {
  const projectRoot = process.cwd();
  const isWin = process.platform === "win32";

  // 1. Check tools/jadx/bin
  const bundledBat = path.join(projectRoot, "tools", "jadx", "bin", "jadx.bat");
  const bundledSh = path.join(projectRoot, "tools", "jadx", "bin", "jadx");

  if (isWin && fs.existsSync(bundledBat)) {
    return bundledBat;
  }
  if (!isWin && fs.existsSync(bundledSh)) {
    return bundledSh;
  }

  // 2. Check system PATH
  const pathDirs = (process.env.PATH || "").split(path.delimiter);
  const exeName = isWin ? "jadx.bat" : "jadx";
  for (const dir of pathDirs) {
    const candidate = path.join(dir, exeName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function collectFilesRecursively(dir: string, baseDir: string): CodeFile[] {
  const files: CodeFile[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursively(fullPath, baseDir));
    } else if (entry.isFile() && (entry.name.endsWith(".java") || entry.name.endsWith(".kt") || entry.name.endsWith(".smali"))) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
        files.push({ relative_path: relPath, content });
      } catch {
        // ignore unreadable files
      }
    }
  }
  return files;
}

export async function decompileAndExtractCode(
  apkPath: string,
  jobDir: string,
  zip: AdmZip
): Promise<{ stats: DecompileStats; codeFiles: CodeFile[] }> {
  const startTime = Date.now();
  const decompiledDir = path.join(jobDir, "decompiled");
  if (!fs.existsSync(decompiledDir)) {
    fs.mkdirSync(decompiledDir, { recursive: true });
  }

  const jadxBin = findJadxBinary();

  // 1. Try JADX execution if binary is present
  if (jadxBin) {
    try {
      const stats = await new Promise<DecompileStats>((resolve) => {
        const args = ["-d", decompiledDir, "--no-res", apkPath];
        const child = execFile(jadxBin, args, { timeout: 90000, shell: true }, (error, stdout, stderr) => {
          const elapsed = Number(((Date.now() - startTime) / 1000).toFixed(2));
          const warnings: string[] = [];
          const combined = `${stdout || ""}\n${stderr || ""}`;

          for (const line of combined.split("\n")) {
            const trimmed = line.trim();
            if (trimmed.includes("WARN") || trimmed.includes("ERROR")) {
              if (warnings.length < 10) {
                warnings.push(trimmed.slice(0, 200));
              }
            }
          }

          if (error && !fs.existsSync(decompiledDir)) {
            resolve({
              status: "failed",
              method: "jadx",
              file_count: 0,
              time_taken_seconds: elapsed,
              error: error.message,
              decompilation_incomplete: true,
              decompilation_warnings: [error.message],
            });
            return;
          }

          const files = collectFilesRecursively(decompiledDir, decompiledDir);
          resolve({
            status: files.length > 0 ? "complete" : "partial",
            method: "jadx",
            file_count: files.length,
            time_taken_seconds: elapsed,
            decompilation_incomplete: Boolean(error) || warnings.length > 0,
            decompilation_warnings: warnings,
          });
        });
      });

      const files = collectFilesRecursively(decompiledDir, decompiledDir);
      if (files.length > 0) {
        return { stats, codeFiles: files };
      }
    } catch (e: any) {
      console.warn("Jadx execution failed, falling back to archive extraction", e);
    }
  }

  // 2. Fallback: Extract raw .java / .kt files from zip
  const rawCodeFiles: CodeFile[] = [];
  const zipEntries = zip.getEntries();
  for (const entry of zipEntries) {
    if (
      !entry.isDirectory &&
      (entry.entryName.endsWith(".java") || entry.entryName.endsWith(".kt") || entry.entryName.endsWith(".smali"))
    ) {
      try {
        const content = entry.getData().toString("utf8");
        rawCodeFiles.push({
          relative_path: entry.entryName.replace(/\\/g, "/"),
          content,
        });
      } catch {
        // ignore
      }
    }
  }

  if (rawCodeFiles.length > 0) {
    const elapsed = Number(((Date.now() - startTime) / 1000).toFixed(2));
    return {
      stats: {
        status: "complete",
        method: "raw_source",
        file_count: rawCodeFiles.length,
        time_taken_seconds: elapsed,
        decompilation_incomplete: false,
        decompilation_warnings: [],
      },
      codeFiles: rawCodeFiles,
    };
  }

  // 3. DEX Bytecode String Extraction Fallback
  const dexCodeFiles: CodeFile[] = [];
  let dexCount = 0;
  for (const entry of zipEntries) {
    if (!entry.isDirectory && entry.entryName.endsWith(".dex")) {
      dexCount++;
      const dexBuf = entry.getData();
      const extractedStrings = extractDexStrings(dexBuf);
      if (extractedStrings.length > 0) {
        dexCodeFiles.push({
          relative_path: entry.entryName,
          content: extractedStrings.join("\n"),
        });
      }
    }
  }

  const elapsed = Number(((Date.now() - startTime) / 1000).toFixed(2));

  if (dexCodeFiles.length > 0) {
    return {
      stats: {
        status: "complete",
        method: "dex_strings",
        file_count: dexCodeFiles.length,
        time_taken_seconds: elapsed,
        decompilation_incomplete: false,
        decompilation_warnings: jadxBin
          ? []
          : ["JADX not available; analyzed raw DEX bytecode string constants."],
      },
      codeFiles: dexCodeFiles,
    };
  }

  return {
    stats: {
      status: "failed",
      method: "none",
      file_count: 0,
      time_taken_seconds: elapsed,
      error: "No source files or DEX bytecode could be extracted.",
      decompilation_incomplete: true,
      decompilation_warnings: ["No extractable code files found in archive."],
    },
    codeFiles: [],
  };
}

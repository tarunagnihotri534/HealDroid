import { DecompileStats, Finding, ManifestData, Report } from "./types";
import { computeScore, scoreToGrade, computeSummary, sortFindings } from "./scoring";

export function generateReport(
  appName: string,
  findings: Finding[],
  decompilationStats?: DecompileStats | null,
  manifestData?: ManifestData | null
): Report {
  const resolvedAppName = manifestData?.package_name || appName;
  const score = computeScore(findings);
  const grade = scoreToGrade(score);
  const summary = computeSummary(findings);
  const sortedFindings = sortFindings(findings);

  let decompIncomplete = false;
  let decompWarnings: string[] = [];

  if (decompilationStats) {
    decompIncomplete =
      decompilationStats.decompilation_incomplete ||
      decompilationStats.status === "failed" ||
      decompilationStats.status === "partial";
    decompWarnings = [...decompilationStats.decompilation_warnings];
    if (decompilationStats.error && !decompWarnings.includes(decompilationStats.error)) {
      decompWarnings.push(decompilationStats.error);
    }
  }

  return {
    app_name: resolvedAppName,
    score,
    grade,
    decompilation_incomplete: decompIncomplete,
    decompilation_warnings: decompWarnings,
    findings: sortedFindings,
    summary,
  };
}

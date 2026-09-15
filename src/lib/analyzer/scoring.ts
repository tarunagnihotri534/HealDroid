import { Finding, ReportSummary, SeverityLevel } from "./types";

const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  critical: 15,
  high: 10,
  medium: 5,
  low: 2,
};

const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function computeScore(findings: Finding[]): number {
  let score = 100;
  for (const f of findings) {
    const sev = f.severity.toLowerCase() as SeverityLevel;
    score -= SEVERITY_WEIGHTS[sev] || 0;
  }
  return Math.max(0, score);
}

export function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function computeSummary(findings: Finding[]): ReportSummary {
  const summary: ReportSummary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const f of findings) {
    const sev = f.severity.toLowerCase() as SeverityLevel;
    if (summary[sev] !== undefined) {
      summary[sev]++;
    }
  }

  return summary;
}

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const orderA = SEVERITY_ORDER[a.severity.toLowerCase() as SeverityLevel] ?? 99;
    const orderB = SEVERITY_ORDER[b.severity.toLowerCase() as SeverityLevel] ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    if (a.location !== b.location) {
      return a.location.localeCompare(b.location);
    }
    return a.title.localeCompare(b.title);
  });
}

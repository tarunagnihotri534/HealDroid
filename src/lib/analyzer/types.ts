export type SeverityLevel = "critical" | "high" | "medium" | "low";
export type ComponentType = "activity" | "service" | "receiver" | "provider";

export interface Finding {
  id: string;
  severity: SeverityLevel;
  title: string;
  owasp_category: string;
  location: string;
  evidence: string;
  remediation: string;
}

export interface ManifestComponent {
  name: string;
  type: ComponentType;
  exported: boolean;
  permission?: string | null;
  intent_filters: string[];
}

export interface ManifestData {
  package_name: string;
  min_sdk?: string | null;
  target_sdk?: string | null;
  target_sdk_version?: number | null;
  network_security_config?: string | null;
  permissions: string[];
  components: ManifestComponent[];
  debuggable: boolean;
  allow_backup: boolean;
  uses_cleartext_traffic: boolean;
}

export interface DecompileStats {
  status: "pending" | "decompiling" | "complete" | "failed";
  method: "jadx" | "raw_source" | "dex_strings" | "none";
  file_count: number;
  time_taken_seconds: number;
  error?: string | null;
  decompilation_incomplete: boolean;
  decompilation_warnings: string[];
}

export interface ReportSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface Report {
  app_name: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  decompilation_incomplete: boolean;
  decompilation_warnings: string[];
  findings: Finding[];
  summary: ReportSummary;
}

export interface JobResponse {
  job_id: string;
  app_name: string;
  file_size_bytes: number;
  status: "processing" | "complete" | "failed" | "partial";
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  decompilation_incomplete: boolean;
  decompilation_warnings: string[];
  findings: Finding[];
  summary: ReportSummary;
  manifest?: ManifestData | null;
  decompilation?: DecompileStats | null;
  error?: string | null;
}

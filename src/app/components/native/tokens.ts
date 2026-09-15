/**
 * HealDroid Unified Design Tokens for React Native & Web
 */
export const T = {
  bg: "#F2F4F8",
  white: "#FFFFFF",
  surf2: "#F8F9FB",
  border: "#E4E7EC",
  text1: "#101828",
  text2: "#344054",
  text3: "#667085",
  text4: "#98A2B3",
  accent: "#13B8A6",
  accentBg: "rgba(19,184,166,0.08)",
  accentRing: "rgba(19,184,166,0.25)",
  critical: "#F04438",
  critBg: "rgba(240,68,56,0.08)",
  high: "#F79009",
  highBg: "rgba(247,144,9,0.08)",
  medium: "#EAB308",
  medBg: "rgba(234,179,8,0.08)",
  low: "#98A2B3",
  lowBg: "rgba(152,162,179,0.1)",
  success: "#13B8A6",
  successBg: "rgba(19,184,166,0.08)",
  shadow: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
  shadowMd: "0 4px 8px -2px rgba(16,24,40,0.08), 0 2px 4px -2px rgba(16,24,40,0.04)",
} as const;

export type Severity = "critical" | "high" | "medium" | "low";

export const SEV: Record<Severity, { color: string; bg: string; label: string }> = {
  critical: { color: T.critical, bg: T.critBg, label: "Critical" },
  high: { color: T.high, bg: T.highBg, label: "High" },
  medium: { color: T.medium, bg: T.medBg, label: "Medium" },
  low: { color: T.low, bg: T.lowBg, label: "Low" },
};

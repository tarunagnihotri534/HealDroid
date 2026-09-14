import { useState, useEffect } from "react";
import {
  Shield, Upload, FileText, List, BookOpen,
  X, CheckCircle, Terminal, RefreshCw, Download,
  Search, Plus, ArrowLeft, ChevronDown, Activity,
  Database, Code, AlertCircle, CheckCircle2, AlertTriangle,
  ChevronRight, Clock, Zap,
} from "lucide-react";
import { SpotlightNav } from "@/app/components/ui/spotlight-nav";
import { ProfileSheet } from "@/app/components/ui/profile-sheet";

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────────
const T = {
  bg:         "#F2F4F8",
  white:      "#FFFFFF",
  surf2:      "#F8F9FB",
  border:     "#E4E7EC",
  text1:      "#101828",
  text2:      "#344054",
  text3:      "#667085",
  text4:      "#98A2B3",
  accent:     "#13B8A6",
  accentBg:   "rgba(19,184,166,0.08)",
  accentRing: "rgba(19,184,166,0.25)",
  critical:   "#F04438",
  critBg:     "rgba(240,68,56,0.08)",
  high:       "#F79009",
  highBg:     "rgba(247,144,9,0.08)",
  medium:     "#EAB308",
  medBg:      "rgba(234,179,8,0.08)",
  low:        "#98A2B3",
  lowBg:      "rgba(152,162,179,0.1)",
  success:    "#13B8A6",
  successBg:  "rgba(19,184,166,0.08)",
  shadow:     "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
  shadowMd:   "0 4px 8px -2px rgba(16,24,40,0.08), 0 2px 4px -2px rgba(16,24,40,0.04)",
} as const;

type Severity   = "critical" | "high" | "medium" | "low";
type Screen     = "upload" | "processing" | "report" | "findings" | "rules";
type StageState = "pending" | "active" | "complete";

const SEV: Record<Severity, { color: string; bg: string; label: string }> = {
  critical: { color: T.critical, bg: T.critBg,  label: "Critical" },
  high:     { color: T.high,     bg: T.highBg,   label: "High"     },
  medium:   { color: T.medium,   bg: T.medBg,    label: "Medium"   },
  low:      { color: T.low,      bg: T.lowBg,    label: "Low"      },
};

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
interface Finding {
  id: string; title: string; severity: Severity; owasp: string;
  location: string; evidence: string; remediation: string;
  ruleId: string; source: "manifest" | "code";
}
interface Rule {
  id: string; title: string; severity: Severity; owasp: string;
  type: "manifest-attribute" | "regex"; enabled: boolean; pattern: string;
}

const FINDINGS: Finding[] = [
  { id:"F001", severity:"critical", owasp:"M3", source:"manifest",
    title:"Cleartext HTTP Traffic Allowed",
    location:"AndroidManifest.xml",
    evidence:'android:usesCleartextTraffic="true"',
    remediation:"Set android:usesCleartextTraffic to false and configure a Network Security Configuration file to enforce HTTPS for all outbound traffic.",
    ruleId:"APK-MANIF-001" },
  { id:"F002", severity:"critical", owasp:"M1", source:"manifest",
    title:"Exported Activity Without Permission",
    location:"com.app.LoginActivity",
    evidence:'android:exported="true"\nandroid:permission — NOT SET',
    remediation:"Add android:permission with a signature-level permission, or set android:exported to false if external access is not required.",
    ruleId:"APK-MANIF-003" },
  { id:"F003", severity:"high", owasp:"M9", source:"code",
    title:"Hardcoded API Key Detected",
    location:"com.app.NetworkClient:L142",
    evidence:'String apiKey = "sk-prod-a8f3b2c1d4e5f6a7b8";',
    remediation:"Remove hardcoded credentials. Rotate the exposed key. Use encrypted keystores or environment-injected secrets at runtime.",
    ruleId:"APK-CODE-012" },
  { id:"F004", severity:"medium", owasp:"M5", source:"code",
    title:"Insecure Random Number Generator",
    location:"com.app.TokenManager:L89",
    evidence:"new Random().nextInt(999999)",
    remediation:"Replace java.util.Random with java.security.SecureRandom for all token and session ID generation.",
    ruleId:"APK-CODE-008" },
  { id:"F005", severity:"medium", owasp:"M8", source:"manifest",
    title:"Debuggable Flag in Production Build",
    location:"AndroidManifest.xml",
    evidence:'android:debuggable="true"',
    remediation:"Remove android:debuggable or set it explicitly to false in all production build variants.",
    ruleId:"APK-MANIF-002" },
  { id:"F006", severity:"low", owasp:"M2", source:"code",
    title:"World-Readable External Storage",
    location:"com.app.FileManager:L201",
    evidence:"Environment.getExternalStorageDirectory()",
    remediation:"Use app-private directories (getFilesDir, getCacheDir) instead of world-readable external storage.",
    ruleId:"APK-CODE-019" },
];

const RULES: Rule[] = [
  { id:"APK-MANIF-001", title:"Cleartext Traffic",    severity:"critical", owasp:"M3", type:"manifest-attribute", enabled:true,  pattern:"usesCleartextTraffic.*true"           },
  { id:"APK-MANIF-002", title:"Debuggable Build",     severity:"medium",   owasp:"M8", type:"manifest-attribute", enabled:true,  pattern:"debuggable.*true"                     },
  { id:"APK-MANIF-003", title:"Exported Component",   severity:"critical", owasp:"M1", type:"manifest-attribute", enabled:true,  pattern:"exported.*true"                       },
  { id:"APK-CODE-008",  title:"Insecure RNG",         severity:"medium",   owasp:"M5", type:"regex",              enabled:true,  pattern:"new\\s+Random\\(\\)"                  },
  { id:"APK-CODE-012",  title:"Hardcoded Credential", severity:"high",     owasp:"M9", type:"regex",              enabled:true,  pattern:"(apiKey|secret|token)\\s*=\\s*\"[^\"]+" },
  { id:"APK-CODE-019",  title:"External Storage",     severity:"low",      owasp:"M2", type:"regex",              enabled:false, pattern:"getExternalStorageDirectory"          },
];

const PIPELINE = [
  { id:"ingest",    label:"Ingestion",     sub:"Load & validate .apk",  Icon:Upload   },
  { id:"decompile", label:"Decompilation", sub:"jadx · dex → Java",     Icon:Code     },
  { id:"extract",   label:"Extraction",    sub:"Manifest · permissions", Icon:Database },
  { id:"rules",     label:"Rule Engine",   sub:"42 rules evaluated",     Icon:Shield   },
  { id:"score",     label:"Scoring",       sub:"OWASP weighting",        Icon:Activity },
];

const LOG_LINES = [
  "[jadx]          loading apk: com.bank.android-release.apk (18.4 MB)",
  "[jadx]          decompiling classes.dex — 147 classes, 892 methods",
  "[jadx]          output written to /tmp/decompiled/",
  "[androguard]    parsed 42 permissions, 14 activities, 6 services",
  "[manifest]      extracted: minSdk=24 targetSdk=33",
  "[rule-engine]   starting pass — 42 rules loaded",
  "[APK-MANIF-001] MATCH  usesCleartextTraffic=true",
  "[APK-MANIF-002] MATCH  debuggable=true",
  "[APK-MANIF-003] MATCH  LoginActivity exported, no permission",
  "[APK-CODE-012]  MATCH  hardcoded credential NetworkClient.java:142",
  "[APK-CODE-008]  MATCH  insecure RNG TokenManager.java:89",
  "[APK-CODE-019]  MATCH  external storage FileManager.java:201",
  "[scoring]       weighted risk score: 42 / 100  grade: D",
  "[report]        generation complete — 6 findings",
];

const RECENT = [
  { name:"com.bank.android",   score:42, grade:"D", sev:"critical" as Severity, ts:"2h ago"  },
  { name:"com.retailapp.shop", score:71, grade:"C", sev:"medium"   as Severity, ts:"1d ago"  },
  { name:"com.health.tracker", score:88, grade:"B", sev:"low"      as Severity, ts:"3d ago"  },
  { name:"com.fintech.wallet", score:31, grade:"F", sev:"critical" as Severity, ts:"5d ago"  },
];

// ── NAV CONFIG ────────────────────────────────────────────────────────────────
const NAV_SCREENS: Screen[] = ["upload","processing","report","findings","rules"];
const NAV_ITEMS = [
  { icon: Upload,   label: "Scan"     },
  { icon: Activity, label: "Status"   },
  { icon: FileText, label: "Report"   },
  { icon: List,     label: "Findings" },
  { icon: BookOpen, label: "Rules"    },
];

// ── ATOMS ──────────────────────────────────────────────────────────────────────
const ui   = "Inter, system-ui, sans-serif";
const mono = "IBM Plex Mono, monospace";

function Card({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ backgroundColor: T.white, boxShadow: T.shadow, border: `1px solid ${T.border}`, ...style }}
    >
      {children}
    </div>
  );
}

function Pill({ children, color = T.accent, bg = T.accentBg, size = "sm" }: {
  children: React.ReactNode; color?: string; bg?: string; size?: "xs" | "sm";
}) {
  const cls = size === "xs" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1";
  return (
    <span className={cls} style={{ color, backgroundColor: bg, borderRadius: 999, fontFamily: mono, fontWeight: 500, display: "inline-block" }}>
      {children}
    </span>
  );
}

function SevBadge({ sev }: { sev: Severity }) {
  return <Pill color={SEV[sev].color} bg={SEV[sev].bg}>{SEV[sev].label}</Pill>;
}

function SevDot({ sev }: { sev: Severity }) {
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SEV[sev].color }} />;
}

function OChip({ code }: { code: string }) {
  return <Pill color={T.accent} bg={T.accentBg} size="xs">{code}</Pill>;
}

function PrimaryBtn({ children, onClick, disabled = false, full = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${full ? "w-full" : ""}`}
      style={{
        borderRadius: 999,
        backgroundColor: disabled ? T.border : T.accent,
        color: disabled ? T.text4 : T.white,
        fontFamily: ui,
        boxShadow: disabled ? "none" : "0 1px 2px rgba(19,184,166,0.3)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all active:scale-95"
      style={{ borderRadius: 999, border: `1px solid ${T.border}`, color: T.text2, backgroundColor: T.white, fontFamily: ui, boxShadow: T.shadow }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: T.text4, fontFamily: ui }}>
      {children}
    </p>
  );
}

function AlertBar({ type, children }: { type: "success" | "warning" | "error"; children: React.ReactNode }) {
  const cfg = {
    success: { color: T.success,  bg: T.successBg, Icon: CheckCircle2  },
    warning: { color: T.medium,   bg: T.medBg,     Icon: AlertTriangle  },
    error:   { color: T.critical, bg: T.critBg,    Icon: AlertCircle   },
  }[type];
  const { Icon } = cfg;
  return (
    <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderRadius: 999, backgroundColor: cfg.bg }}>
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} strokeWidth={2} />
      <span className="text-sm font-medium" style={{ color: cfg.color, fontFamily: ui }}>{children}</span>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative transition-colors flex-shrink-0"
      style={{
        width: 40, height: 22, borderRadius: 999,
        backgroundColor: on ? T.accent : T.border,
      }}
    >
      <span
        className="absolute top-0.5 transition-all"
        style={{
          width: 18, height: 18, borderRadius: 999,
          backgroundColor: T.white,
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          left: on ? 20 : 2,
        }}
      />
    </button>
  );
}

function ScoreArc({ score }: { score: number }) {
  const R = 54, cx = 72, cy = 72;
  const half = Math.PI * R;
  const prog = (score / 100) * half;
  const col = score >= 70 ? T.success : score >= 50 ? T.medium : score >= 30 ? T.high : T.critical;
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 50 ? "D" : "F";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="144" height="90" viewBox="0 0 144 90">
        <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`}
          fill="none" stroke={T.border} strokeWidth="7" strokeLinecap="round" />
        <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`}
          fill="none" stroke={col} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${prog} ${half}`} />
        <text x={cx} y={cy-10} textAnchor="middle" fontSize="30" fontWeight="700" fontFamily={ui} fill={T.text1}>{score}</text>
        <text x={cx} y={cy+6} textAnchor="middle" fontSize="10" fontFamily={ui} fill={T.text4} letterSpacing="0.08em">RISK SCORE</text>
      </svg>
      <span className="text-xs font-bold px-3 py-1" style={{ borderRadius: 999, color: col, backgroundColor: `${col}18`, fontFamily: ui }}>
        GRADE {grade}
      </span>
    </div>
  );
}

interface JobData {
  job_id: string;
  app_name: string;
  file_size_bytes: number;
  status: string;
  manifest?: {
    package_name: string;
    min_sdk?: string;
    target_sdk?: string;
    permissions: string[];
    components: { name: string; type: string; exported: boolean; permission?: string; intent_filters: string[] }[];
    debuggable: boolean;
    allow_backup: boolean;
    uses_cleartext_traffic: boolean;
  };
  decompilation?: {
    status: string;
    method: string;
    file_count: number;
    time_taken_seconds: number;
    error?: string;
  };
}

// ── SCREENS ───────────────────────────────────────────────────────────────────
function UploadScreen({
  onScan,
}: {
  onScan: (file: File | null, fileName: string) => void;
}) {
  const [dragging,     setDragging]     = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName,     setFileName]     = useState<string>("com.bank.android-release.apk");
  const [fileSizeText, setFileSizeText] = useState<string>("18.4 MB (sample APK)");
  const [showAdv,      setShowAdv]      = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const handleFilePicked = (f: File) => {
    setSelectedFile(f);
    setFileName(f.name);
    const szMb = (f.size / (1024 * 1024)).toFixed(1);
    setFileSizeText(`${szMb} MB`);
  };

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-28 space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text1, fontFamily: ui }}>Analyze an APK</h1>
        <p className="text-sm mt-1" style={{ color: T.text3, fontFamily: ui }}>
          Phase 1 + 2: Manifest parsing, jadx decompilation & code extraction.
        </p>
      </div>

      <input
        type="file"
        accept=".apk"
        id="apk-file-input"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFilePicked(f);
        }}
      />

      {/* Drop zone */}
      <Card
        style={{
          border: `2px dashed ${dragging ? T.accent : T.border}`,
          backgroundColor: dragging ? T.accentBg : T.white,
          boxShadow: dragging ? `0 0 0 4px ${T.accentRing}` : T.shadow,
          transition: "all 0.2s", cursor: "pointer",
        }}
        className="p-8"
      >
        <div
          className="flex flex-col items-center gap-4"
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFilePicked(f);
          }}
          onClick={() => {
            const input = document.getElementById("apk-file-input") as HTMLInputElement;
            if (input) input.click();
          }}
        >
          <div className="w-14 h-14 flex items-center justify-center" style={{ borderRadius: 18, backgroundColor: T.accentBg }}>
            <Shield className="w-7 h-7" style={{ color: T.accent }} strokeWidth={1.5} />
          </div>
          {fileName ? (
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold" style={{ color: T.text1, fontFamily: mono }}>{fileName}</p>
              <AlertBar type="success">APK ready — {fileSizeText}</AlertBar>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: T.text1, fontFamily: ui }}>Drop .apk file here</p>
              <p className="text-xs mt-1" style={{ color: T.text4, fontFamily: ui }}>or tap to browse · max 500 MB</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick sample APK selector */}
      <div className="flex items-center justify-between px-2 text-xs">
        <span style={{ color: T.text3 }}>Test fixtures available:</span>
        <button
          type="button"
          onClick={() => {
            setSelectedFile(null);
            setFileName("com.bank.android-release.apk");
            setFileSizeText("Default test APK");
          }}
          className="font-medium underline"
          style={{ color: T.accent }}
        >
          Load Default Fixture
        </button>
      </div>

      {/* Advanced options */}
      <Card>
        <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => setShowAdv(!showAdv)}>
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4" style={{ color: T.text3 }} strokeWidth={1.5} />
            <span className="text-sm font-medium" style={{ color: T.text2, fontFamily: ui }}>Decompiler options</span>
          </div>
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{ color: T.text4, transform: showAdv ? "rotate(180deg)" : "rotate(0)" }}
            strokeWidth={1.5}
          />
        </button>
        {showAdv && (
          <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${T.border}` }}>
            <div className="pt-4 space-y-4">
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: T.text3, fontFamily: ui }}>Engine</p>
                <select
                  className="w-full text-sm px-4 py-2.5 outline-none"
                  style={{ borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surf2, color: T.text1, fontFamily: ui }}
                >
                  <option>jadx 1.5.6 (bundled)</option>
                </select>
              </div>
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: T.text3, fontFamily: ui }}>Subprocess Timeout</p>
                <select
                  className="w-full text-sm px-4 py-2.5 outline-none"
                  style={{ borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.surf2, color: T.text1, fontFamily: ui }}
                >
                  <option>90 seconds (standard)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      <PrimaryBtn onClick={() => onScan(selectedFile, fileName)} disabled={!fileName} full>
        <Shield className="w-4 h-4" strokeWidth={1.5} />
        Decompile & Extract APK
      </PrimaryBtn>

      <div>
        <SectionLabel>Recent Scans</SectionLabel>
        <Card>
          {RECENT.map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderBottom: i < RECENT.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: SEV[s.sev].bg }}>
                <SevDot sev={s.sev} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: T.text1, fontFamily: mono }}>{s.name}</p>
                <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: T.text4, fontFamily: ui }}>
                  <Clock className="w-3 h-3" strokeWidth={1.5} />{s.ts}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: T.text1, fontFamily: ui }}>{s.score}</span>
                <span className="text-xs font-bold w-7 h-7 flex items-center justify-center"
                  style={{ borderRadius: 8, backgroundColor: SEV[s.sev].bg, color: SEV[s.sev].color, fontFamily: ui }}>
                  {s.grade}
                </span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ProcessingScreen({
  file,
  fileName,
  jobData,
  setJobData,
  onReset,
}: {
  file: File | null;
  fileName: string;
  jobData: JobData | null;
  setJobData: (j: JobData | null) => void;
  onReset: () => void;
}) {
  const [stages, setStages] = useState<StageState[]>(["active", "pending", "pending", "pending", "pending"]);
  const [logs,   setLogs]   = useState<string[]>([`[client] preparing upload for ${fileName}...`]);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runDecompilation() {
      try {
        setLogs(prev => [...prev, `[client] connecting to /api/upload...`]);
        const formData = new FormData();

        if (file) {
          formData.append("file", file);
        } else {
          // Fetch default public APK fixture
          setLogs(prev => [...prev, `[client] loading public/com.bank.android-release.apk...`]);
          const res = await fetch("/com.bank.android-release.apk");
          const blob = await res.blob();
          formData.append("file", blob, fileName);
        }

        // Stage 0: Ingestion
        setStages(["active", "pending", "pending", "pending", "pending"]);
        setLogs(prev => [...prev, `[ingest] sending APK to backend pipeline...`]);

        const uploadPromise = fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        // Advance to decompilation stage visually while backend processes
        setTimeout(() => {
          if (!cancelled) {
            setStages(["complete", "active", "pending", "pending", "pending"]);
            setLogs(prev => [
              ...prev,
              `[ingest] APK validated and saved to storage`,
              `[jadx] starting jadx decompiler subprocess...`,
            ]);
          }
        }, 600);

        const response = await uploadPromise;
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Upload failed (${response.status}): ${errText}`);
        }

        const data: JobData = await response.json();
        if (cancelled) return;

        setJobData(data);

        // Stages updated based on real results
        setStages(["complete", "complete", "complete", "pending", "pending"]);
        setLogs(prev => [
          ...prev,
          `[manifest] extracted package: ${data.manifest?.package_name || "unknown"}`,
          `[manifest] found ${data.manifest?.permissions.length || 0} permissions, ${data.manifest?.components.length || 0} components`,
          `[jadx] decompiler finished (${data.decompilation?.time_taken_seconds || 0}s, method: ${data.decompilation?.method})`,
          `[extractor] ${data.decompilation?.file_count || 0} Java source files extracted and verified`,
          `[pipeline] Phase 1 + 2 completed successfully. Ready for Phase 3 (Rule Engine).`,
        ]);
        setDone(true);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Decompilation failed");
        setStages(["complete", "pending", "pending", "pending", "pending"]);
        setLogs(prev => [...prev, `[error] ${err.message}`]);
      }
    }

    runDecompilation();
    return () => {
      cancelled = true;
    };
  }, [file, fileName]);

  const stagesDone = stages.filter(s => s === "complete").length;
  const pct = done ? 60 : Math.round((stagesDone / PIPELINE.length) * 100);

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-28 space-y-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text1, fontFamily: ui }}>
          {done ? "Extraction Complete" : "Decompiling APK…"}
        </h1>
        <p className="text-xs mt-1" style={{ color: T.text3, fontFamily: mono }}>{fileName}</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: T.text1, fontFamily: ui }}>
            {done ? "Phase 1 + 2 Complete" : error ? "Decompilation Failed" : "Decompiling & Extracting…"}
          </span>
          <span className="text-sm font-bold" style={{ color: T.accent, fontFamily: ui }}>
            {done ? "60%" : `${pct}%`}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: T.bg }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${done ? 60 : pct}%`, backgroundColor: error ? T.critical : T.accent }} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: T.text3, fontFamily: ui }}>
            {stagesDone} of {PIPELINE.length} stages complete
          </span>
          {done && jobData?.decompilation && (
            <span className="text-xs font-semibold px-2.5 py-1"
              style={{ borderRadius: 999, color: T.success, backgroundColor: T.successBg, fontFamily: ui }}>
              ✓ {jobData.decompilation.file_count} Java files extracted
            </span>
          )}
        </div>
      </Card>

      {/* Proof of decompilation stats card */}
      {done && jobData && (
        <Card className="p-5 space-y-3" style={{ border: `1px solid ${T.accent}` }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.accent, fontFamily: ui }}>
              Decompilation Proof & Extraction Stats
            </span>
            <Pill color={T.accent} bg={T.accentBg}>Job: {jobData.job_id}</Pill>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: T.surf2 }}>
              <p className="text-[10px]" style={{ color: T.text4 }}>Java Files Extracted</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: T.text1, fontFamily: mono }}>
                {jobData.decompilation?.file_count} files
              </p>
            </div>
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: T.surf2 }}>
              <p className="text-[10px]" style={{ color: T.text4 }}>Decompilation Time</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: T.text1, fontFamily: mono }}>
                {jobData.decompilation?.time_taken_seconds}s
              </p>
            </div>
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: T.surf2 }}>
              <p className="text-[10px]" style={{ color: T.text4 }}>Engine / Method</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: T.text1, fontFamily: mono }}>
                {jobData.decompilation?.method === "jadx" ? "jadx 1.5.6" : "source bundle"}
              </p>
            </div>
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: T.surf2 }}>
              <p className="text-[10px]" style={{ color: T.text4 }}>Declared Permissions</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: T.text1, fontFamily: mono }}>
                {jobData.manifest?.permissions.length || 0} permissions
              </p>
            </div>
          </div>

          <div className="pt-1 text-[11px] space-y-1" style={{ color: T.text2, fontFamily: ui }}>
            <p><span className="font-semibold">Package:</span> <code style={{ fontFamily: mono }}>{jobData.manifest?.package_name}</code></p>
            <p><span className="font-semibold">Components:</span> {jobData.manifest?.components.length || 0} (Activities, Services, Receivers)</p>
            <p><span className="font-semibold">SDK Support:</span> minSdk {jobData.manifest?.min_sdk || "N/A"}, targetSdk {jobData.manifest?.target_sdk || "N/A"}</p>
          </div>

          <div className="p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: T.accentBg }}>
            <CheckCircle className="w-4 h-4" style={{ color: T.accent }} />
            <span className="text-xs font-medium" style={{ color: T.text2 }}>
              Ready for Phase 3: Rule engine will iterate over the extracted source files.
            </span>
          </div>
        </Card>
      )}

      {/* Pipeline stage cards */}
      <Card className="p-5">
        <SectionLabel>Pipeline Stages</SectionLabel>
        <div className="space-y-1">
          {PIPELINE.map(({ id, label, sub, Icon }, i) => {
            const state = stages[i];
            const isPhase3 = i >= 3;
            return (
              <div key={id} className="flex items-center gap-3 py-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: state === "complete" ? T.successBg : state === "active" ? T.accentBg : T.bg }}>
                  {state === "complete"
                    ? <CheckCircle className="w-4 h-4" style={{ color: T.success }} strokeWidth={2} />
                    : state === "active"
                    ? <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: T.accent }} />
                    : <Icon className="w-4 h-4" style={{ color: T.text4 }} strokeWidth={1.5} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium"
                    style={{ color: state === "complete" ? T.text1 : state === "active" ? T.accent : T.text4, fontFamily: ui }}>
                    {label} {isPhase3 && <span className="text-[10px] font-normal" style={{ color: T.text4 }}>(Phase 3)</span>}
                  </p>
                  <p className="text-[10px]" style={{ color: T.text4, fontFamily: mono }}>
                    {state === "complete" && i === 1 && jobData?.decompilation
                      ? `${jobData.decompilation.file_count} files in ${jobData.decompilation.time_taken_seconds}s`
                      : state === "complete" && i === 2 && jobData?.manifest
                      ? `${jobData.manifest.permissions.length} perms, ${jobData.manifest.components.length} comps`
                      : sub}
                  </p>
                </div>
                {state === "complete" && (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: T.success }} strokeWidth={2} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Live terminal scan logs */}
      <Card>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          <Terminal className="w-3.5 h-3.5" style={{ color: T.text3 }} strokeWidth={1.5} />
          <span className="text-xs font-medium" style={{ color: T.text3, fontFamily: ui }}>decompilation.log</span>
          {!done && !error && <span className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: T.accent }} />}
        </div>
        <div className="p-4 max-h-36 overflow-y-auto" style={{ backgroundColor: T.surf2, borderRadius: "0 0 16px 16px" }}>
          {logs.map((line, i) => (
            <p key={i} className="text-[11px] leading-5"
              style={{
                fontFamily: mono,
                color: line.includes("[error]") ? T.critical : line.includes("[jadx]") || line.includes("[extractor]") ? T.accent : line.includes("[pipeline]") ? T.success : T.text3,
              }}>
              {line}
            </p>
          ))}
          {!done && !error && <span className="text-xs animate-pulse" style={{ fontFamily: mono, color: T.accent }}>█</span>}
        </div>
      </Card>

      {done && (
        <PrimaryBtn onClick={onReset} full>
          Scan Another APK
        </PrimaryBtn>
      )}
    </div>
  );
}

function ReportScreen({ onFindings }: { onFindings: () => void }) {
  const counts = {
    critical: FINDINGS.filter(f => f.severity === "critical").length,
    high:     FINDINGS.filter(f => f.severity === "high").length,
    medium:   FINDINGS.filter(f => f.severity === "medium").length,
    low:      FINDINGS.filter(f => f.severity === "low").length,
  };
  const owasp10 = ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10"];
  const hit = new Set(FINDINGS.map(f => f.owasp));

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-28 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium" style={{ color: T.text4, fontFamily: ui }}>Scan complete</p>
          <h2 className="text-lg font-bold mt-0.5" style={{ color: T.text1, fontFamily: mono }}>com.bank.android</h2>
          <p className="text-xs mt-0.5" style={{ color: T.text4, fontFamily: ui }}>Sep 14 2026 · 09:41 UTC</p>
        </div>
        <div className="flex gap-2 flex-shrink-0 pt-1">
          <GhostBtn><RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} /> Rescan</GhostBtn>
          <GhostBtn><Download className="w-3.5 h-3.5" strokeWidth={1.5} /></GhostBtn>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <ScoreArc score={42} />
          <div className="flex-1 space-y-3">
            <SectionLabel>By Severity</SectionLabel>
            <div className="flex h-2 rounded-full overflow-hidden gap-px">
              {(["critical","high","medium","low"] as Severity[]).map(s => (
                <div key={s} style={{ flex: counts[s] || 0, backgroundColor: SEV[s].color }} />
              ))}
            </div>
            <div className="space-y-2">
              {(["critical","high","medium","low"] as Severity[]).map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: SEV[s].color }} />
                  <span className="text-xs flex-1" style={{ color: T.text3, fontFamily: ui }}>{SEV[s].label}</span>
                  <span className="text-sm font-bold" style={{ color: counts[s] ? SEV[s].color : T.text4, fontFamily: ui }}>{counts[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {(["critical","high","medium","low"] as Severity[]).map(s => (
          <Card key={s} className="p-3 text-center">
            <span className="block text-xl font-bold" style={{ color: counts[s] ? SEV[s].color : T.text4, fontFamily: ui }}>{counts[s]}</span>
            <span className="block text-[9px] font-semibold tracking-wide mt-1" style={{ color: T.text4, fontFamily: ui }}>{s.toUpperCase()}</span>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <SectionLabel>OWASP Mobile Top 10</SectionLabel>
        <div className="grid grid-cols-5 gap-2">
          {owasp10.map(cat => {
            const f = FINDINGS.find(fi => fi.owasp === cat);
            const active = hit.has(cat);
            return (
              <div key={cat} className="flex items-center justify-center py-2.5 text-[11px] font-bold"
                style={{ borderRadius: 10, backgroundColor: active && f ? SEV[f.severity].bg : T.bg,
                  color: active && f ? SEV[f.severity].color : T.text4, fontFamily: mono }}>
                {cat}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-2">
        <AlertBar type="error">2 Critical findings require immediate action</AlertBar>
        <AlertBar type="warning">1 High severity credential exposure detected</AlertBar>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Top Findings</SectionLabel>
          <button className="text-xs font-semibold" style={{ color: T.accent, fontFamily: ui }} onClick={onFindings}>
            View all ({FINDINGS.length}) →
          </button>
        </div>
        <Card>
          {FINDINGS.slice(0, 3).map((f, i) => (
            <button key={f.id} className="w-full text-left flex items-center gap-3 px-5 py-4 active:bg-gray-50 transition-colors"
              style={{ borderBottom: i < 2 ? `1px solid ${T.border}` : "none" }} onClick={onFindings}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: SEV[f.severity].bg }}>
                <SevDot sev={f.severity} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: T.text1, fontFamily: ui }}>{f.title}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: T.text4, fontFamily: mono }}>{f.location}</p>
              </div>
              <OChip code={f.owasp} />
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}

function FindingsScreen({ onSelect }: { onSelect: (f: Finding) => void }) {
  const [q,   setQ]   = useState("");
  const [sev, setSev] = useState<Severity | "all">("all");

  const visible = FINDINGS.filter(f => {
    const mQ = !q || f.title.toLowerCase().includes(q.toLowerCase()) || f.location.toLowerCase().includes(q.toLowerCase());
    const mS = sev === "all" || f.severity === sev;
    return mQ && mS;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* filters — fixed inside the screen */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3" style={{ backgroundColor: T.bg }}>
        <div className="flex items-center gap-2 px-4 py-3"
          style={{ borderRadius: 999, backgroundColor: T.white, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: T.text4 }} strokeWidth={1.5} />
          <input
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#98A2B3]"
            style={{ color: T.text1, fontFamily: ui }}
            placeholder="Search findings…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          {q && <button onClick={() => setQ("")}><X className="w-4 h-4" style={{ color: T.text4 }} strokeWidth={1.5} /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {(["all","critical","high","medium","low"] as const).map(s => {
            const active = sev === s;
            const color  = s === "all" ? T.accent : SEV[s]?.color;
            const bg     = s === "all" ? T.accentBg : SEV[s]?.bg;
            return (
              <button key={s}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold flex-shrink-0 transition-all"
                style={{
                  borderRadius: 999,
                  backgroundColor: active ? color : T.white,
                  color: active ? T.white : T.text3,
                  border: `1px solid ${active ? color : T.border}`,
                  boxShadow: active ? `0 2px 4px ${color}33` : T.shadow,
                  fontFamily: ui,
                }}
                onClick={() => setSev(s)}
              >
                {active && <CheckCircle className="w-3 h-3" strokeWidth={2.5} />}
                {s === "all" ? "All" : SEV[s].label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: T.text4, fontFamily: ui }}>{visible.length} findings</span>
          {sev !== "all" && (
            <button className="text-xs flex items-center gap-1" style={{ color: T.text3, fontFamily: ui }} onClick={() => setSev("all")}>
              <X className="w-3 h-3" /> clear
            </button>
          )}
        </div>
      </div>

      {/* scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-28">
        {visible.map(f => (
          <button key={f.id} className="w-full text-left active:scale-[0.98] transition-transform" onClick={() => onSelect(f)}>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: SEV[f.severity].bg }}>
                  <SevDot sev={f.severity} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug" style={{ color: T.text1, fontFamily: ui }}>{f.title}</p>
                    <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: T.text4 }} strokeWidth={1.5} />
                  </div>
                  <p className="text-[10px] mt-1 truncate" style={{ color: T.text4, fontFamily: mono }}>{f.location}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <SevBadge sev={f.severity} />
                    <OChip code={f.owasp} />
                    <span className="text-[10px]" style={{ color: T.text4, fontFamily: mono }}>{f.source}</span>
                  </div>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

function FindingDetail({ finding: f, onClose }: { finding: Finding; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ backgroundColor: T.bg }}>
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ backgroundColor: T.white, borderBottom: `1px solid ${T.border}`, boxShadow: T.shadow }}>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center" style={{ borderRadius: 999, backgroundColor: T.bg }}>
          <ArrowLeft className="w-4 h-4" style={{ color: T.text2 }} strokeWidth={2} />
        </button>
        <p className="flex-1 text-sm font-semibold truncate" style={{ color: T.text1, fontFamily: ui }}>{f.title}</p>
        <SevBadge sev={f.severity} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <OChip code={f.owasp} />
          <Pill color={T.text3} bg={T.bg} size="xs">{f.source}</Pill>
          <Pill color={T.text3} bg={T.bg} size="xs">{f.ruleId}</Pill>
        </div>

        <Card className="p-4">
          <SectionLabel>Location</SectionLabel>
          <div className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: T.accentBg }}>
            <code className="text-sm" style={{ color: T.accent, fontFamily: mono }}>{f.location}</code>
          </div>
        </Card>

        <Card className="p-4">
          <SectionLabel>Evidence</SectionLabel>
          <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: T.bg }}>
            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: T.high, fontFamily: mono }}>{f.evidence}</pre>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: T.successBg }}>
              <Shield className="w-3 h-3" style={{ color: T.success }} strokeWidth={2} />
            </div>
            <SectionLabel>Remediation</SectionLabel>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: T.successBg }}>
            <p className="text-sm leading-relaxed" style={{ color: T.text1, fontFamily: ui }}>{f.remediation}</p>
          </div>
        </Card>

        <Card className="p-4">
          <SectionLabel>Rule Details</SectionLabel>
          <div className="space-y-2.5">
            {[["Rule ID", f.ruleId], ["Data source", f.source], ["OWASP", f.owasp]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: T.text3, fontFamily: ui }}>{k}</span>
                <code className="text-xs" style={{ color: T.text1, fontFamily: mono }}>{v}</code>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <GhostBtn>Mark false positive</GhostBtn>
          <GhostBtn>Accept risk</GhostBtn>
        </div>
      </div>
    </div>
  );
}

function RulesScreen() {
  const [rules, setRules]  = useState<Rule[]>(RULES);
  const [expanded, setExp] = useState<string | null>(null);
  const toggle = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 flex items-center justify-between" style={{ backgroundColor: T.bg }}>
        <p className="text-xs" style={{ color: T.text4, fontFamily: ui }}>
          {rules.filter(r => r.enabled).length} active · {rules.length} total
        </p>
        <GhostBtn><Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add rule</GhostBtn>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2.5 pb-28">
        {rules.map(rule => (
          <Card key={rule.id}>
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: SEV[rule.severity].bg }}>
                <SevDot sev={rule.severity} />
              </div>
              <button className="flex-1 min-w-0 text-left" onClick={() => setExp(expanded === rule.id ? null : rule.id)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: T.text1, fontFamily: ui }}>{rule.title}</span>
                  <OChip code={rule.owasp} />
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: T.text4, fontFamily: mono }}>{rule.id}</p>
              </button>
              <Toggle on={rule.enabled} onToggle={() => toggle(rule.id)} />
              <button onClick={() => setExp(expanded === rule.id ? null : rule.id)}>
                <ChevronDown className="w-4 h-4 transition-transform"
                  style={{ color: T.text4, transform: expanded === rule.id ? "rotate(180deg)" : "rotate(0)" }} strokeWidth={1.5} />
              </button>
            </div>
            {expanded === rule.id && (
              <div className="px-4 pb-4" style={{ borderTop: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2 my-3">
                  <SevBadge sev={rule.severity} />
                  <Pill color={T.text3} bg={T.bg} size="xs">{rule.type}</Pill>
                </div>
                <div className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: T.bg }}>
                  <p className="text-[11px]" style={{ fontFamily: mono, color: T.text2 }}>
                    <span style={{ color: T.text4 }}>pattern: </span>
                    <span style={{ color: T.high }}>{rule.pattern}</span>
                  </p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [navIdx,       setNavIdx]       = useState(0);
  const [selected,     setSelected]     = useState<Finding | null>(null);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [isDark,       setIsDark]       = useState(false);
  const [scanFile,     setScanFile]     = useState<File | null>(null);
  const [scanFileName, setScanFileName] = useState<string>("com.bank.android-release.apk");
  const [jobData,      setJobData]      = useState<JobData | null>(null);

  const screen = NAV_SCREENS[navIdx];

  const handleStartScan = (file: File | null, fileName: string) => {
    setScanFile(file);
    setScanFileName(fileName);
    setJobData(null);
    setNavIdx(1); // switch to processing
  };

  return (
    <div className="flex justify-center" style={{ backgroundColor: "#E8EAF0", minHeight: "100dvh" }}>
      {/* phone shell */}
      <div
        className="relative w-full max-w-[430px] flex flex-col"
        style={{ height: "100dvh", overflow: "hidden", backgroundColor: T.bg }}
      >
        {/* ── TOP BAR — safe-area aware ── */}
        <div
          className="flex-shrink-0"
          style={{
            backgroundColor: T.white,
            borderBottom: `1px solid ${T.border}`,
            boxShadow: T.shadow,
            /* Push content below Dynamic Island / status bar */
            paddingTop: "env(safe-area-inset-top, 0px)",
          }}
        >
          <div
            className="flex items-center justify-between px-5"
            style={{ height: 52 }}
          >
            {/* Shield icon only — no wordmark */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36,
                borderRadius: 11,
                backgroundColor: T.accentBg,
              }}
            >
              <Shield className="w-5 h-5" style={{ color: T.accent }} strokeWidth={2} />
            </div>

            {/* Profile avatar — exactly 44×44 tap target per iOS HIG */}
            <button
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile"
              style={{
                /* 44×44 outer tap target */
                width: 44, height: 44,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 999,
                /* visual circle is 34×34 inside the tap target */
              }}
            >
              <div
                className="flex items-center justify-center text-xs font-bold"
                style={{
                  width: 34, height: 34,
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #13B8A6 0%, #0E9284 100%)",
                  color: T.white,
                  fontFamily: ui,
                  boxShadow: "0 2px 8px rgba(19,184,166,0.28)",
                }}
              >
                JD
              </div>
            </button>
          </div>
        </div>

        {/* ── CONTENT — fills all remaining height, overlays float on top ── */}
        <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
          {screen === "upload" && (
            <UploadScreen onScan={handleStartScan} />
          )}
          {screen === "processing" && (
            <ProcessingScreen
              file={scanFile}
              fileName={scanFileName}
              jobData={jobData}
              setJobData={setJobData}
              onReset={() => {
                setJobData(null);
                setNavIdx(0);
              }}
            />
          )}
          {screen === "report"     && <ReportScreen onFindings={() => setNavIdx(3)} />}
          {screen === "findings"   && <FindingsScreen onSelect={setSelected} />}
          {screen === "rules"      && <RulesScreen />}

          {/* Finding detail */}
          {selected && <FindingDetail finding={selected} onClose={() => setSelected(null)} />}

          {/* Floating spotlight nav */}
          <SpotlightNav
            items={NAV_ITEMS}
            activeIndex={navIdx}
            onSelect={setNavIdx}
          />

          {/* Profile bottom sheet */}
          <ProfileSheet
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            isDark={isDark}
            onThemeToggle={() => setIsDark(d => !d)}
            onSignOut={() => setProfileOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
